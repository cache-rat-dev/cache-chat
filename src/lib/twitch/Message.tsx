/**
 * @module Message
 */
import React from "react";

import { Emote } from "./Emote";

export class Message {
	meta: Record<string, any> = {};
	badges: string[] = [];
	type: string = "";
	rawContent: string = "";
	content: React.ReactNode[] | string = "";

	private constructor(raw: string) {
		const spaceIdx = raw.indexOf(" ");
		const rawMeta = raw.slice(0, spaceIdx).trim();
		const rest = raw.slice(spaceIdx).trim();

		// Split IRC prefix/command from trailing message safely
		const trailingIdx = rest.indexOf(" :");
		const commandPart =
			trailingIdx !== -1 ? rest.slice(0, trailingIdx) : rest;
		this.rawContent = trailingIdx !== -1 ? rest.slice(trailingIdx + 2) : "";

		const commandTokens = commandPart.split(" ");
		this.type = commandTokens[1] ?? "";

		this.meta = rawMeta
			.slice(1)
			.split(";")
			.reduce((acc: Record<string, any>, cur: string) => {
				const [key, ...valueParts] = cur.split("=");
				if (key) {
					acc[key.trim()] = valueParts.join("=").trim();
				}
				return acc;
			}, {});

		if (this.type === "PRIVMSG") {
			this.badges = this.meta.badges
				? this.meta.badges.split(",").filter(Boolean)
				: [];

			const emotes: Emote[] | undefined = this.meta.emotes
				? this.meta.emotes
						.split("/")
						.filter(Boolean)
						.map((e: string) => new Emote(e))
				: undefined;

			this.meta.emotes = emotes;

			if (!emotes || emotes.length === 0) {
				this.content = this.rawContent;
			} else {
				// 1. Flatten all ranges first, THEN sort globally by start index
				const replacements = emotes
					.flatMap((e: Emote) =>
						e.ranges.map((r) => ({
							start: r.start,
							end: r.end,
							id: e.id,
							url: e.url
						}))
					)
					.sort((a, b) => a.start - b.start);

				// 2. Use Array.from so Unicode code points (emojis) match Twitch's indices
				const chars = Array.from(this.rawContent);
				const els: React.ReactNode[] = [];
				let lastIdx = 0;

				replacements.forEach((r, idx) => {
					if (r.start > lastIdx) {
						els.push(
							<span key={`text-${idx}-${lastIdx}`}>
								{chars.slice(lastIdx, r.start).join("")}
							</span>
						);
					}

					const emoteText = chars.slice(r.start, r.end + 1).join("");
					els.push(
						<img
							key={`emote-${r.id}-${idx}`}
							src={r.url}
							alt={emoteText}
							title={emoteText}
						/>
					);

					lastIdx = r.end + 1;
				});

				if (lastIdx < chars.length) {
					els.push(
						<span key={`text-end-${lastIdx}`}>
							{chars.slice(lastIdx).join("")}
						</span>
					);
				}

				this.content = els;
			}
		}
	}

	static fromRaw(raw: string): Message | null {
		// Check command token specifically so user messages containing "PRIVMSG" don't false-trigger
		if (!raw.includes(" ROOMSTATE ") && !raw.includes(" PRIVMSG ")) {
			return null;
		}
		return new Message(raw);
	}
}
