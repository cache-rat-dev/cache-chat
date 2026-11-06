"use client";

import { useEffect } from "react";

interface ChatClientProps {
	accessToken: string;
}

const CHAT_ID = "38953507";
const MY_ID = "706557723";

export default function ChatClient({ accessToken }: ChatClientProps) {
	useEffect(() => {
		if (!accessToken) return;

		let sessionID = "";
		let socket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");

		const subscribeToChat = async (currentSessionId: string) => {
			const url = "https://api.twitch.tv/helix/eventsub/subscriptions";
			const payload = {
				type: "channel.chat.message",
				version: "1",
				condition: { broadcaster_user_id: CHAT_ID, user_id: MY_ID },
				transport: { method: "websocket", session_id: currentSessionId }
			};

			try {
				const resp = await fetch(url, {
					method: "POST",
					headers: {
						// Note: Twitch Helix API requires "Bearer", not "OAuth" for the Authorization header
						"Authorization": `Bearer ${accessToken}`,
						"Client-Id":
							process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? "",
						"Content-Type": "application/json"
					},
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

		const handleMessage = (message: any) => {
			const type = message.metadata.message_type;

			if (type === "session_welcome") {
				sessionID = message.payload.session.id;
				console.log("[SOCKET] GOT ID:", sessionID);
				subscribeToChat(sessionID);
			}

			if (type === "notification") {
				console.log("[SOCKET] MESSAGE:", message.payload.event);
			}
		};

		socket.onopen = () => {
			console.log("[SOCK] CONNECTED");
		};

		socket.onmessage = (event) => {
			handleMessage(JSON.parse(event.data));
		};

		socket.onclose = (event) => {
			console.warn("[SOCK] CLOSED:", event.code, event.reason);
			socket = new WebSocket("wss://eventsub.wss.twitch.tv/ws");
		};

		// Clean up connection when component unmounts
		return () => {
			socket.close();
		};
	}, [accessToken]);

	return <p>Chat status: Connected to event stream.</p>;
}
