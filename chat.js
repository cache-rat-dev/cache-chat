/**
 * @file Chatter Logic
 * @author Cache Rat <crat.media@proton.me>
 */

/**
 * Body element
 */
const body = document.getElementsByTagName("body")[0];

/**
 * Websocket to the Twitch API
 */
const socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
/**
 * Twitch API Session ID. Empty at init, to be set later.
 */
let sessionID = "";

// The socket is open.
socket.onopen = () => {
	console.log("[SOCKET] CONNECTED")
}

// All messages sent from the API are handed off to the handleMessage method.
socket.onmessage = (event) => {
	handleMessage(JSON.parse(event.data))
}

/**
 * Handles messages sent from the API.
 * @param {Object} message - JSON object of the message.
 */
const handleMessage = (message) => {
	/**
	 * Message type. This is used to trigger conditional logic.
	 */
	const type = message.metadata.message_type

	// If the message is a welcome message, save the session ID and use it to subscribe to the chat event.
	if (type == "session_welcome") {
		sessionID = message.payload.session.id
		console.log("[SOCKET] GOT ID: ", sessionID)

		subscribeToChat()
	}

	// If the message is a notification, it's a chat message.
	if (type == "notification") {
		console.log(`${message.payload.event.chatter_user_name}`, message.payload.event)
		const chatMsg = document.createElement('div');
		chatMsg.setAttribute('name', message.payload.event.message_id);

		const chatterName = document.createElement('b');
		chatterName.style.color = message.payload.event.color;
		chatterName.innerText = message.payload.event.chatter_user_name;
		chatMsg.appendChild(chatterName)

		const chatterContent = document.createElement('span');
		chatterContent.innerText = `: ${message.payload.event.message.text}`
		chatMsg.appendChild(chatterContent)
		
		body.prepend(chatMsg)
	}
}

/**
 * Subscribe to the Chat Event
 */
const subscribeToChat = async () => {
	const url = "https://api.twitch.tv/helix/eventsub/subscriptions"
	const chatID = "62191658" // ID of the user whose chat is being listened to. CURRENTLY: https://twitch.tv/pezzzy
	const myID = "706557723" // My ID.

	const payload = {
		type: "channel.chat.message",
		version: "1",
		condition: {
			broadcaster_user_id: chatID,
			user_id: myID
		},
		transport: {
			method: "websocket",
			session_id: sessionID
		},
	}

	try {
		const resp = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer 5pk0v0hmz7zq2ykasrouq6o57phjwo',
				'Client-Id': 'bh0d5hebkf4wv8dh8n9lf9x2ykqtqe',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!resp.ok) {
			throw new Error(`HTTP Error: Status: ${resp.status}`)
		}

		const result = await resp.json();
		console.log("[SOCKET] Subscribed!", result)
	} catch (error) {
		console.error('Error posting:', error)
	}
}