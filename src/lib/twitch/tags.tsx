/**
 * Logic for the handling of {@link Tags}.
 * @module tags
 */
import { Badge, convert_badge_string_to_badges } from "@/lib/twitch/badge";
import { convert_emote_string_to_emotes, Emote } from "@/lib/twitch/emote";
import type { ITags } from "@/lib/twitch/types";

export type { ITags } from "@/lib/twitch/types";

export class Tags implements ITags {
	badge_info?: Badge[] | undefined;
	badges?: Badge[] | undefined;
	bits?: number | undefined;
	color!: string;
	display_name!: string;
	emotes?: Emote[] | undefined;
	id!: string;
	subscriber!: boolean;
	tmi_sent_ts!: number;
	user_id!: number;
	user_type!: "" | "admin" | "global_mod" | "staff";

	constructor(raw_tags_string: string) {
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

		let badge_info = convert_badge_string_to_badges(tag["badge-info"]);
		if (badge_info) this.badge_info = badge_info;

		let badges = convert_badge_string_to_badges(tag["badges"]);
		if (badges) this.badges = badges;

		let bits = tag["bits"];
		if (bits) this.bits = bits;

		this.color = tag["color"] ?? "#ff0000";

		this.display_name = tag["display-name"] ?? "Anonymous";

		let emotes = convert_emote_string_to_emotes(tag["emotes"]);
		if (emotes) this.emotes = emotes;

		this.id = tag["id"];

		this.subscriber = Boolean(Number(tag["subscriber"]));

		this.tmi_sent_ts = Number(tag["tmi-sent-ts"]);

		this.user_id = Number(tag["user-id"]);

		this.user_type = tag["user-type"];
	}
}
