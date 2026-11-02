/**
 * @file Chatter Logic
 * @author Cache Rat <crat.media@proton.me>
 */

const body = document.getElementsByTagName("body")[0];

const socket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");
let sessionID = "";

const chatID = "247808909"; // ID of the user whose chat is being listened to. CURRENTLY: https://twitch.tv/QTCinderella
const myID = "706557723"; // My ID.

const bearerToken = "Bearer hmpq9rh4au1fobixy7bkzxt092eod1";
const clientId = "bh0d5hebkf4wv8dh8n9lf9x2ykqtqe";

let channelBadges;

// get the channel badges
(async () => {
	const url = `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${chatID}`;

	try {
		const resp = await fetch(url, {
			method: "GET",
			headers: { "Authorization": bearerToken, "Client-Id": clientId }
		});

		if (!resp.ok) {
			throw new Error(
				"[EMOTES] Failed getting channel emotes due to HTTP error:",
				resp.status
			);
		}

		const result = await resp.json();
		console.log("[EMOTES] Channel Emotes Loaded: ", result.data);
		channelBadges = result.data;
	} catch (error) {
		console.error(
			"[EMOTES] Failed getting channel emotes due to some error:",
			error
		);
	}
})();

let globalBadges;

// get the global badges
(async () => {
	const url = `https://api.twitch.tv/helix/chat/badges/global`;

	try {
		const resp = await fetch(url, {
			method: "GET",
			headers: { "Authorization": bearerToken, "Client-Id": clientId }
		});

		if (!resp.ok) {
			throw new Error(
				"[EMOTES] Failed getting global emotes due to HTTP error:",
				resp.status
			);
		}

		const result = await resp.json();
		console.log("[EMOTES] Global Emotes Loaded: ", result.data);
		globalBadges = result.data;
	} catch (error) {
		console.error(
			"[EMOTES] Failed getting global emotes due to some error:",
			error
		);
	}
})();

// The socket is open.
socket.onopen = () => {
	console.log("[SOCKET] CONNECTED");
};

// All messages sent from the API are handed off to the handleMessage method.
socket.onmessage = (event) => {
	handleMessage(JSON.parse(event.data));
};

/**
 * Handles messages sent from the API.
 * @param {Object} message - JSON object of the message.
 */
const handleMessage = (message) => {
	/**
	 * Message type. This is used to trigger conditional logic.
	 */
	const type = message.metadata.message_type;

	// If the message is a welcome message, save the session ID and use it to subscribe to the chat event.
	if (type == "session_welcome") {
		sessionID = message.payload.session.id;
		console.log("[SOCKET] GOT ID: ", sessionID);

		subscribeToChat();
	}

	// If the message is a notification, it's a chat message.
	if (type == "notification") {
		formMessage(message.payload.event);
	}
};

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
		const hasChannelBadge = channelBadges.some(
			(cb) => cb.set_id === b.set_id
		);

		const newBadge = document.createElement("img");
		newBadge.classList.add("badge");
		if (hasChannelBadge) {
			const badgeSet = channelBadges.find((cb) => cb.set_id === b.set_id);
			const badgeVersion = badgeSet.versions.find((cb) => cb.id == b.id);
			newBadge.src = badgeVersion.image_url_1x;
		} else {
			const badgeSet = globalBadges.find((gb) => gb.set_id === b.set_id);
			const badgeVersion = badgeSet.versions.find((gb) => gb.id == b.id);
			newBadge.src = badgeVersion.image_url_1x;
		}

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
};

/**
 * Subscribe to the Chat Event
 */
const subscribeToChat = async () => {
	const url = "https://api.twitch.tv/helix/eventsub/subscriptions";

	const payload = {
		type: "channel.chat.message",
		version: "1",
		condition: { broadcaster_user_id: chatID, user_id: myID },
		transport: { method: "websocket", session_id: sessionID }
	};

	try {
		const resp = await fetch(url, {
			method: "POST",
			headers: {
				"Authorization": bearerToken,
				"Client-Id": clientId,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});

		if (!resp.ok) {
			throw new Error(
				`[SOCKET] Failed subscribing due to HTTP error: ${resp.status}`
			);
		}

		const result = await resp.json();
		console.log("[SOCKET] Subscribed!", result);
	} catch (error) {
		console.error("[SOCKET] Failed subscribing due to some error:", error);
	}
};

/**
 * Convert hexcodes into RGB values. This code's straight up stolen.
 * @param {string} hex - #RRGGBB
 * @returns {{r: number, g: number, b: number}
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

	// Return both an object and a css-ready string representation
	return { r, g, b };
};

/**
 * @param {{r: number, g: number, b: number}} color
 * @returns {number} Brightness
 */
const getBrightness = (color) => {
	return (
		((0.299 * color.r) ^ 2) +
		((0.587 * color.g) ^ 2) +
		((0.114 * color.b) ^ 2)
	);
};
