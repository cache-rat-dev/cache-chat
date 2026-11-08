"use client";

import { useEffect, useState } from "react";

const username = "kaicenat";

/**
 * Defines a Badge, which consists of its ID and its version
 */
interface Badge {
	id: string; // the set-id, e.g. "subscriber"
	version: string; // for badge_info subscriber: months subscribed
}

/**
 * Defines an Emote, which consists of its ID and an array of ranges where it exists in a chat message
 */
interface Emote {
	id: string;
	ranges: { start: number; end: number }[];
}

/**
 * Defines a GIF, which consists of its start and end range in a chat message, its ID and its URL
 */
interface GIF {
	start: number;
	end: number;
	id: string;
	url: string;
}

/**
 * Defines information supplied if the chat message is in response to another.
 */
interface Reply {
	parent_msg_id: string;
	parent_user_id: number;
	parent_user_login: string;
	parent_display_name: string;
	parent_msg_body: string;
	thread_parent_msg_id: string;
	thread_parent_user_login: string;
}

/**
 * Defines a chat message's tags
 */
interface ChatTags {
	badge_info?: Badge[];
	badges?: Badge[];
	bits?: number;
	color: string; // may be "" if never set
	display_name: string; // may be "" if never set
	emotes?: Emote[];
	gifs?: GIF[];
	id: string;
	mod: boolean;
	reply?: Reply;
	room_id: number;
	source_badges?: Badge[];
	source_badge_info?: Badge[];
	source_id?: string; // shared chat only
	source_room_id?: number; // shared chat only
	source_only?: boolean; // shared chat only
	subscriber: boolean;
	tmi_sent_ts: number;
	turbo: boolean;
	user_id: number;
	user_type: "" | "admin" | "global_mod" | "staff";
	vip: boolean; // true iff the tag is present
}

const ChatSocket = () => {
	const [messages, setMessages] = useState<
		{ username: string; message: string }[]
	>([]);

	useEffect(() => {
		let socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

		const handle_message = (event: any) => {
			if (event.startsWith("PING")) {
				socket.send("PONG :tmi.twitch.tv");
				return;
			}

			if (event.includes("PRIVMSG")) {
				// const username = event.split('!')[0].replace(':', '')
				// const message = event.split('PRIVMSG #kaicenat :')[1].trim()

				// setMessages((prev) => [...prev.slice(-49), { username, message }]);
				setMessages((prev) => [...prev.slice(-49), { username: '', message: event.replace(':', '__________') }])
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
				<p key={idx}>{message.message}</p>
			))}
		</div>
	);
};

export default ChatSocket;
