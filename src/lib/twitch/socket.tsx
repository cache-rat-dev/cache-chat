"use client";

import { useEffect, useState } from "react";

const username = "shenpai";

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
 * Defines a chat message's tags
 */
interface ChatTags {
	badge_info?: Badge[];
	badges?: Badge[];
	bits?: number;
	color: string; // may be "" if never set
	display_name: string; // may be "" if never set
	emotes?: Emote[];
	id: string;
	subscriber: boolean;
	tmi_sent_ts: number;
	user_id: number;
	user_type: "" | "admin" | "global_mod" | "staff";
}

const ChatSocket = () => {
	const [messages, setMessages] = useState<
		{ username: string; message: string }[]
	>([]);

	/**
	 * Convert badge strings into an array of Badges... or return nothing
	 * @param badge_string Raw string of badge information
	 * @returns { Badge[] | undefined } Array of Badge objects, or nothing if there aren't any badges
	 */
	const convert_badge_string_to_badges = (
		badge_string: string
	): Badge[] | undefined => {
		// If the badge string is empty, there's no badges, and we're done here.
		if (badge_string === "") return undefined;

		/**
		 * Convert a badge string into a Badge.
		 * @param badge An individual badge string of format {id}/{version}
		 * @returns { Badge } Badge object
		 */
		const handle_badge = (badge: string): Badge => {
			const slash = badge.indexOf("/");
			return slash === -1
				? { id: badge, version: "" }
				: {
						id: badge.slice(0, slash),
						version: badge.slice(slash + 1)
					};
		};

		/**
		 * Get all the badges!
		 */
		const badges = badge_string.split(",").map(handle_badge);

		// If there's no badges, return undefined. Otherwise, return the existing badges.
		return badges.length > 0 ? badges : undefined;
	};

	/**
	 * Convert emote strings into an array of Emotes... or return nothing
	 * @param emote_string Raw string of emotes information
	 * @returns { Emote[] | undefined } Array of Emote objects, or nothing if there aren't any badges
	 */
	const convert_emote_string_to_emotes = (
		emote_string: string
	): Emote[] | undefined => {
		if (emote_string === "") return undefined;

		/**
		 * Convert an emote string into an Emote.
		 * @param emote An individual emote string of format {id}/{ranges}
		 * @returns { Emote } Emote object
		 */
		const handle_emote = (emote: string): Emote => {
			const [id, ranges_string] = emote.split(":");
			const ranges = ranges_string.split(",").map((range) => {
				const [start, end] = range.split("-").map((n) => Number(n));

				return { start: start, end: end };
			});

			return { id: id, ranges: ranges };
		};

		const emotes = emote_string.split("/").map(handle_emote);

		return emotes.length > 0 ? emotes : undefined;
	};

	const parse_tags = (raw_tags_string: string): ChatTags => {
		const cleaned_tags_string = raw_tags_string.slice(1); // Remove the '@' at the start of the string
		const tags_array = cleaned_tags_string.split(";"); // Split the string into its individual tags.

		/**
		 * Convert the array into an Object, for better access.
		 */
		const tag = tags_array.reduce((acc: any, current: any) => {
			const [key, ...valueParts] = current.split("=");

			if (key) {
				const value = valueParts.join("=").trim();
				acc[key.trim()] = value;
			}

			return acc;
		}, {});

		// This is where we start populating the chat tags.
		let chat_tags: any = {};

		// BADGE INFO
		let badge_info = convert_badge_string_to_badges(tag["badge-info"]);
		if (badge_info) chat_tags.badge_info = badge_info;

		// BADGES
		let badges = convert_badge_string_to_badges(tag["badges"]);
		if (badges) chat_tags.badges = badges;

		// BITS
		let bits = tag["bits"];
		if (bits) chat_tags.bits = bits;

		// COLOR
		chat_tags.color = tag["color"] ?? "#ff0000";

		// DISPLAY NAME
		chat_tags.display_name = tag["display-name"] ?? "Anonymous";

		// EMOTES
		let emotes = convert_emote_string_to_emotes(tag["emotes"]);
		if (emotes) chat_tags.emotes = emotes;

		/* 
		TODO:
		- ID,
		- Subscriber Status,
		- Sent Time,
		- User ID and Type
		*/

		return chat_tags;
	};

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
				let [info, content] = event.split(" ", 1);
				info = parse_tags(info);
				console.log(info);
				setMessages((prev) => [
					...prev.slice(1),
					{ username: "", message: event }
				]);
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
