"use client";

import { ReactNode, useEffect, useState } from "react";

const username = "cache_rat";

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

interface ChatMessage {
	tags: ChatTags;
	username: string;
	message: ReactNode;
}

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
			: { id: badge.slice(0, slash), version: badge.slice(slash + 1) };
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

	chat_tags.id = tag["id"];

	chat_tags.subscriber = Boolean(Number(tag["subscriber"]));

	chat_tags.time_sent_ts = Number(tag["tmi-sent-ts"]);

	chat_tags.user_id = Number(tag["user-id"]);

	chat_tags.user_type = tag["user-type"];

	return chat_tags;
};

const insert_emotes = (emotes: Emote[], message: string) => {
	if (emotes.length === 0) return <>{message}</>;

	const replacements = emotes
		.flatMap((emote) =>
			emote.ranges.map((range) => ({
				start: range.start,
				end: range.end,
				id: emote.id
			}))
		)
		.sort((a, b) => a.start - b.start);

	const elements: React.ReactNode[] = [];
	let lastIdx = 0;

	replacements.forEach((r, index) => {
		if (r.start > lastIdx) {
			elements.push(message.slice(lastIdx, r.start));
		}

		elements.push(
			<img
				key={`${r.id}-${index}`}
				src={`https://static-cdn.jtvnw.net/emoticons/v2/${r.id}/static/dark/2.0`}
				alt={message.slice(r.start, r.end + 1)}
			/>
		);

		lastIdx = r.end + 1;
	});

	if (lastIdx < message.length) {
		elements.push(message.slice(lastIdx));
	}

	return <>{elements}</>;
};

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
