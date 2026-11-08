/**
 * Logic for the handling of {@link ChatTags}.
 * @module
 */
import { Badge, convert_badge_string_to_badges } from "@/lib/twitch/badge";
import { convert_emote_string_to_emotes, Emote } from "@/lib/twitch/emote";

/**
 * The tags of a {@link ChatMessage}. This includes the chatter's badges, name colour and the emotes used in the message.
 */
export interface ChatTags {
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

const parse_tags = (raw_tags_string: string): ChatTags => {
	const cleaned_tags_string = raw_tags_string.slice(1);
	const tags_array = cleaned_tags_string.split(";");

	const tag = tags_array.reduce((acc: any, current: any) => {
		const [key, ...valueParts] = current.split("=");

		if (key) {
			const value = valueParts.join("=").trim();
			acc[key.trim()] = value;
		}

		return acc;
	}, {});

	let chat_tags: any = {};

	let badge_info = convert_badge_string_to_badges(tag["badge-info"]);
	if (badge_info) chat_tags.badge_info = badge_info;

	let badges = convert_badge_string_to_badges(tag["badges"]);
	if (badges) chat_tags.badges = badges;

	let bits = tag["bits"];
	if (bits) chat_tags.bits = bits;

	chat_tags.color = tag["color"] ?? "#ff0000";

	chat_tags.display_name = tag["display-name"] ?? "Anonymous";

	let emotes = convert_emote_string_to_emotes(tag["emotes"]);
	if (emotes) chat_tags.emotes = emotes;

	chat_tags.id = tag["id"];

	chat_tags.subscriber = Boolean(Number(tag["subscriber"]));

	chat_tags.time_sent_ts = Number(tag["tmi-sent-ts"]);

	chat_tags.user_id = Number(tag["user-id"]);

	chat_tags.user_type = tag["user-type"];

	return chat_tags;
};

export { parse_tags };
