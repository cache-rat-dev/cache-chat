/**
 * @file Chatter Logic
 * @author Cache Rat <crat.media@proton.me>
 */

const body = document.getElementsByTagName("body")[0];

const chatID = "25821344"; // ID of the user whose chat is being listened to. CURRENTLY: https://twitch.tv/shenpai

const clientId = "bh0d5hebkf4wv8dh8n9lf9x2ykqtqe";
const SCOPES = "user:read:chat"; // EventSub channel.chat.message needs this one
const TOKEN_KEY = "twitch_auth";
const DEVICE_URL = "https://id.twitch.tv/oauth2/device";
const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";

let accessToken; // raw user access token
let myID; // ID of the user the token belongs to (comes from /validate)
let sessionID = "";
let socket;
let channelBadges = [];
let globalBadges = [];

/* ------------------------------------------------------------------ */
/* Auth (device code flow)                                             */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const post = (url, params) =>
	fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams(params)
	});

// Small status area shown only while the user has to authorize.
const statusEl = document.createElement("div");
statusEl.id = "auth-status";

const showAuthPrompt = (dc) => {
	const link = document.createElement("a");
	link.href = dc.verification_uri;
	link.target = "_blank";
	link.rel = "noopener";
	link.textContent = "Authorize on Twitch";
	statusEl.replaceChildren(
		link,
		` (code: ${dc.user_code}) - waiting for approval...`
	);
	body.prepend(statusEl);
};

const getDeviceCode = async () => {
	const resp = await post(DEVICE_URL, {
		client_id: clientId,
		scopes: SCOPES
	});

	if (!resp.ok) {
		throw new Error(
			`[AUTH] Failed getting device code: HTTP ${resp.status} ${await resp.text()}`
		);
	}

	return resp.json(); // { device_code, user_code, verification_uri, expires_in, interval }
};

const pollForToken = async (dc) => {
	const deadline = Date.now() + dc.expires_in * 1000;
	let interval = (dc.interval || 5) * 1000;

	while (Date.now() < deadline) {
		await sleep(interval);
		const resp = await post(TOKEN_URL, {
			client_id: clientId,
			scopes: SCOPES,
			device_code: dc.device_code,
			grant_type: "urn:ietf:params:oauth:grant-type:device_code"
		});
		const data = await resp.json();

		if (resp.ok) return data; // { access_token, refresh_token, expires_in, scope, ... }
		if (data.message === "authorization_pending") continue;
		if (data.message === "slow_down") {
			interval += 5000;
			continue;
		}
		throw new Error(
			`[AUTH] Token poll failed: ${data.message || resp.status}`
		);
	}
	throw new Error("[AUTH] Device code expired before approval");
};

const saveAuth = (t) =>
	localStorage.setItem(
		TOKEN_KEY,
		JSON.stringify({
			access_token: t.access_token,
			refresh_token: t.refresh_token
		})
	);

const loadAuth = () => {
	try {
		return JSON.parse(localStorage.getItem(TOKEN_KEY));
	} catch {
		return null;
	}
};

// Returns the validate payload (includes user_id) or null if the token is unusable.
const validateToken = async (token) => {
	try {
		const resp = await fetch(VALIDATE_URL, {
			headers: { Authorization: `OAuth ${token}` }
		});
		if (!resp.ok) return null;

		const data = await resp.json();
		if (data.client_id !== clientId) return null;

		const hasScopes = SCOPES.split(" ").every((s) =>
			data.scopes?.includes(s)
		);
		return hasScopes ? data : null;
	} catch {
		return null;
	}
};

const refresh = async (refreshToken) => {
	try {
		const resp = await post(TOKEN_URL, {
			client_id: clientId,
			grant_type: "refresh_token",
			refresh_token: refreshToken
		});
		return resp.ok ? await resp.json() : null;
	} catch {
		return null;
	}
};

// Stored token -> refresh token -> full device flow. Returns { token, userId }.
const getToken = async ({ onCode }) => {
	const stored = loadAuth();

	if (stored?.access_token) {
		const info = await validateToken(stored.access_token);
		if (info) return { token: stored.access_token, userId: info.user_id };
	}

	if (stored?.refresh_token) {
		const refreshed = await refresh(stored.refresh_token);
		if (refreshed) {
			const info = await validateToken(refreshed.access_token);
			if (info) {
				saveAuth(refreshed);
				return { token: refreshed.access_token, userId: info.user_id };
			}
		}
	}

	const dc = await getDeviceCode();
	onCode(dc);
	const tokens = await pollForToken(dc);

	const info = await validateToken(tokens.access_token);
	if (!info) throw new Error("[AUTH] New token failed validation");

	saveAuth(tokens);
	return { token: tokens.access_token, userId: info.user_id };
};

/* ------------------------------------------------------------------ */
/* Helix: badges                                                       */
/* ------------------------------------------------------------------ */

const helixHeaders = () => ({
	"Authorization": `Bearer ${accessToken}`, // Helix wants "Bearer", not "OAuth"
	"Client-Id": clientId
});

const fetchBadges = async (url) => {
	const resp = await fetch(url, { headers: helixHeaders() });

	if (!resp.ok) {
		throw new Error(`[BADGES] HTTP ${resp.status} ${await resp.text()}`);
	}

	return (await resp.json()).data;
};

// Channel badges override global ones, so check the channel set first.
const findBadge = (setId, id) => {
	for (const list of [channelBadges, globalBadges]) {
		const set = list.find((s) => s.set_id === setId);
		const version = set?.versions.find((v) => v.id == id);
		if (version) return version;
	}
	return null;
};

/* ------------------------------------------------------------------ */
/* EventSub websocket                                                  */
/* ------------------------------------------------------------------ */

const connectSocket = () => {
	socket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");

	socket.onopen = () => {
		console.log("[SOCKET] CONNECTED");
	};

	socket.onmessage = (event) => {
		handleMessage(JSON.parse(event.data));
	};

	socket.onclose = (event) => {
		console.warn("[SOCKET] CLOSED", event.code, event.reason);
	};
};

/**
 * Handles messages sent from the API.
 * @param {Object} message - JSON object of the message.
 */
const handleMessage = (message) => {
	const type = message.metadata.message_type;

	// Welcome: save the session ID and subscribe (must happen within 10s).
	if (type === "session_welcome") {
		sessionID = message.payload.session.id;
		console.log("[SOCKET] GOT ID: ", sessionID);

		subscribeToChat();
	}

	// Notification: it's a chat message.
	if (type === "notification") {
		formMessage(message.payload.event);
	}
};

/**
 * Subscribe to the Chat Event
 */
const subscribeToChat = async () => {
	const url = "https://api.twitch.tv/helix/eventsub/subscriptions";

	const payload = {
		type: "channel.chat.message",
		version: "1",
		// user_id must be the user the token belongs to
		condition: { broadcaster_user_id: chatID, user_id: myID },
		transport: { method: "websocket", session_id: sessionID }
	};

	try {
		const resp = await fetch(url, {
			method: "POST",
			headers: { ...helixHeaders(), "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});

		if (!resp.ok) {
			throw new Error(
				`[SOCKET] Failed subscribing: HTTP ${resp.status} ${await resp.text()}`
			);
		}

		const result = await resp.json();
		console.log("[SOCKET] Subscribed!", result);
	} catch (error) {
		console.error(error);
	}
};

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

const MAX_MESSAGES = 200;

/**
 * Let's turn this JSON data into a fully formed and styled message!
 * @param {Object} message
 */
const formMessage = (message) => {
	// container
	const chatMsg = document.createElement("div");
	chatMsg.classList.add("message");
	chatMsg.setAttribute("name", message.message_id);

	// name
	const chatterNameAndBadges = document.createElement("div");
	chatterNameAndBadges.classList.add("nameAndBadges");

	for (const b of message.badges) {
		const version = findBadge(b.set_id, b.id);
		if (!version) continue; // unknown badge, skip instead of crashing

		const newBadge = document.createElement("img");
		newBadge.classList.add("badge");
		newBadge.alt = b.set_id;
		newBadge.src = version.image_url_1x;
		chatterNameAndBadges.appendChild(newBadge);
	}

	const chatterName = document.createElement("span");
	chatterName.classList.add("name");
	chatterName.innerText = message.chatter_user_name;

	chatterNameAndBadges.appendChild(chatterName);

	if (message.color === "") {
		message.color = "#ff0000";
	}
	chatterNameAndBadges.style.backgroundColor = message.color;
	chatterNameAndBadges.style.color =
		getBrightness(hexToRgb(message.color)) < 128 ? "white" : "black";

	chatMsg.appendChild(chatterNameAndBadges);

	// message
	const chatterContent = document.createElement("div");
	chatterContent.classList.add("content");

	// loop over every fragment to form the message
	for (const f of message.message.fragments) {
		if (f.type == "mention" || f.type == "text") {
			const fragment = document.createElement("span");
			fragment.innerText = f.text;
			chatterContent.appendChild(fragment);
		} else if (f.type == "emote") {
			const fragment = document.createElement("img");
			const isAnimated = f.emote.format.includes("animated");
			fragment.src = `https://static-cdn.jtvnw.net/emoticons/v2/${f.emote.id}/${isAnimated ? "animated" : "static"}/dark/1.0`;
			chatterContent.appendChild(fragment);
		} else {
			const fragment = document.createElement("span");
			fragment.innerText = f.text;
			fragment.style.color = "red";
			chatterContent.appendChild(fragment);
		}
	}

	chatMsg.appendChild(chatterContent);

	body.prepend(chatMsg);

	// Newest messages are at the top, so drop the oldest from the bottom.
	const all = body.querySelectorAll(".message");
	if (all.length > MAX_MESSAGES) all[all.length - 1].remove();
};

/**
 * Convert hexcodes into RGB values. This code's straight up stolen.
 * @param {string} hex - #RRGGBB
 * @returns {{r: number, g: number, b: number}}
 */
const hexToRgb = (hex) => {
	// Remove the '#' if it's present
	hex = hex.replace(/^#/, "");

	// If 3-digit hex (e.g. "f3f"), expand it to 6-digit (e.g. "ff33ff")
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((char) => char + char)
			.join("");
	}

	// Parse the r, g, b values using base 16
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	return { r, g, b };
};

/**
 * Perceived brightness (HSP). Note: ^ is XOR in JS, squaring is **.
 * @param {{r: number, g: number, b: number}} color
 * @returns {number} Brightness, 0-255
 */
const getBrightness = (color) => {
	return Math.sqrt(
		0.299 * color.r ** 2 + 0.587 * color.g ** 2 + 0.114 * color.b ** 2
	);
};

/* ------------------------------------------------------------------ */
/* Startup                                                             */
/* ------------------------------------------------------------------ */

// Only runs once we have a valid token.
const startChat = async () => {
	try {
		[channelBadges, globalBadges] = await Promise.all([
			fetchBadges(
				`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${chatID}`
			),
			fetchBadges("https://api.twitch.tv/helix/chat/badges/global")
		]);
		console.log(
			"[BADGES] Loaded",
			channelBadges.length,
			globalBadges.length
		);
	} catch (error) {
		console.error("[BADGES] Continuing without badges:", error);
	}

	connectSocket();
};

const init = async () => {
	try {
		const { token, userId } = await getToken({
			onCode: (dc) => {
				// Visible link is the reliable path; auto-open is best effort
				// (browsers usually block popups that aren't from a click).
				showAuthPrompt(dc);
				window.open(dc.verification_uri, "_blank", "noopener");
			}
		});

		statusEl.remove();
		accessToken = token;
		myID = userId;
		await startChat();
	} catch (err) {
		console.error(err);
		statusEl.textContent = `Auth failed: ${err.message}`;
		body.prepend(statusEl);
	}
};

if (document.readyState === "loading") {
	window.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
