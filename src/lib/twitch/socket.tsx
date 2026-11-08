/**
 * Chat Socket
 * @module
 */
"use client";

import { ReactNode, useEffect, useState } from "react";

import { insert_emotes } from "@/lib/twitch/emote";
import { ChatTags, parse_tags } from "@/lib/twitch/tags";

const username = "kaicenat";

/**
 * What it says on the tin. Contains the chat message's username, message contents and the {@link ChatTags tags} associated with that message.
 */
export interface ChatMessage {
	tags: ChatTags;
	username: string;
	message: ReactNode;
}

const ChatSocket = () => {
	const [messages, setMessages] = useState<ChatMessage[]>([]);

	useEffect(() => {
		let socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

		const handle_message = (event: any) => {
			if (event.startsWith("PING")) {
				socket.send("PONG :tmi.twitch.tv");
				return;
			}

			if (event.includes("PRIVMSG")) {
				const sep = event.indexOf(" ");
				let info = parse_tags(event.slice(0, sep));
				let content = event.slice(sep + 1);

				const matchString = ` PRIVMSG #${username} :`;
				const splitIdx = content.indexOf(matchString);

				if (splitIdx !== -1) {
					const prefix = content.slice(0, splitIdx);
					const msg = content
						.slice(splitIdx + matchString.length)
						.trim();
					const user = prefix.split("!", 1)[0].replace(/^:/, "");

					setMessages((prev) => [
						...prev.slice(-49),
						{
							tags: info,
							username: user,
							message: insert_emotes(info.emotes ?? [], msg)
						}
					]);
				}
			}
		};

		socket.onopen = () => {
			console.log(`[SOCK] Connected`);
			socket.send("CAP REQ :twitch.tv/tags");
			socket.send("NICK justinfan22243");
			socket.send(`JOIN #${username}`);
		};

		socket.onmessage = (event) => {
			handle_message(event.data);
		};

		socket.onclose = (event) => {
			console.warn(`[SOCK] Closed: ${event.reason}`);
		};

		return () => socket.close();
	}, []);

	return (
		<div>
			{messages.map((message, idx) => (
				<p key={idx}>
					<span style={{ color: message.tags.color }}>
						{message.tags.display_name}
					</span>
					: {message.message}
				</p>
			))}
		</div>
	);
};

export default ChatSocket;
