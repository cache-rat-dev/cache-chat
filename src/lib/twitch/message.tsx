/**
 * @module message
 */

import { ReactNode } from "react";

import { Tags } from "@/lib/twitch/tags";
import type { IMessage } from "@/lib/twitch/types";

export type { IMessage } from "@/lib/twitch/types";

export class Message implements IMessage {
	tags!: Tags;
	username!: string;
	message: ReactNode;

	constructor(username: string, message: ReactNode, tags: Tags) {
		this.username = username;
		this.message = message;
		this.tags = tags;
	}
}
