"use client";

import { useEffect, useRef, useState } from "react";

import { ChatContext } from "./ChatContext";
import { Message } from "./Message";

export const ChatProvider: React.FC<{
	channel: string;
	children: React.ReactNode;
}> = ({ channel, children }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [badges, setBadges] = useState<Record<string, any>>({});
	const [broadcasterID, setBroadcasterID] = useState<string>("");

	const socketRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		if (!channel) return;

		const sock = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
		socketRef.current = sock;

		sock.onopen = () => {
			console.log(`[SOCK] Connected`);
			sock.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
			sock.send("NICK justinfan22243");
			sock.send(`JOIN #${channel}`);
		};

		sock.onmessage = (event) => {
			const raw = String(event.data);
			if (raw.startsWith("PING")) {
				sock.send("PONG :tmi.twitch.tv");
				return;
			}

			const lines = raw.split("\r\n");
			for (const line of lines) {
				const parsed = Message.fromRaw(line);
				if (!parsed) continue;

				if (parsed.type === "ROOMSTATE" && parsed.meta["room-id"]) {
					setBroadcasterID(parsed.meta["room-id"]);
				} else if (parsed.type === "PRIVMSG") {
					setMessages((prev) => [...prev.slice(-29), parsed]);
				}
			}
		};

		return () => sock.close();
	}, [channel]);

	return (
		<ChatContext.Provider
			value={{ messages, badges, broadcasterID }}
		>
			{children}
		</ChatContext.Provider>
	);
};
