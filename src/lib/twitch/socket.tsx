/**
 * Chat Socket
 * @module socket
 */
"use client";

import { useEffect, useState } from "react";

import { insert_emotes } from "@/lib/twitch/emote";
import { Message } from "@/lib/twitch/message";
import { Tags } from "@/lib/twitch/tags";
import { IMessage } from "@/lib/twitch/types";

const username = "cache_rat";

const ChatSocket = () => {
	const [messages, setMessages] = useState<IMessage[]>([]);

	useEffect(() => {
		let socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

		const handle_message = (event: any) => {
			if (event.startsWith("PING")) {
				socket.send("PONG :tmi.twitch.tv");
				return;
			}

			if (event.includes("PRIVMSG")) {
				const sep = event.indexOf(" ");
				let info = new Tags(event.slice(0, sep));
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
						...prev.slice(-29),
						new Message(
							user,
							insert_emotes(info.emotes ?? [], msg),
							info
						)
					]);
				}
			}
		};

		socket.onopen = () => {
			console.log(`[SOCK] Connected`);
			socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
			socket.send("NICK justinfan22243");
			socket.send(`JOIN #${username}`);
		};

		socket.onmessage = (event) => {
			console.log("[SOCK] Message: ", event.data)
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
