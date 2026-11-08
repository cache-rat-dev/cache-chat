/**
 * @module types
 */
import { ReactNode } from "react";

import { Badge } from "@/lib/twitch/badge";
import { Emote } from "@/lib/twitch/emote";

/**
 * What it says on the tin. Contains the chat message's username, message contents and the {@link tags.Tags} associated with that message.
 */
export interface IMessage {
	tags: ITags;
	username: string;
	message: ReactNode;
}

/**
 * The tags of a {@link message.Message}. This includes the chatter's badges, name colour and the emotes used in the message.
 */
export interface ITags {
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

/**
 * An Emote. It consists of the emote's ID and its placement within its parent {@link message.Message}, defined as an array of indice pairs.
 */
export interface IEmote {
	id: string;
	ranges: { start: number; end: number }[];
}

export interface IBadge {
	id: string;
	version: string;
}
