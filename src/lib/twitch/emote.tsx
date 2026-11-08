/**
 * Logic for the handling of {@link IEmote Emotes}.
 * @module emote
 */

import type { IEmote } from "@/lib/twitch/types";

export type { IEmote } from "@/lib/twitch/types";

export class Emote implements IEmote {
	id!: string;
	ranges!: { start: number; end: number; }[];
	
	constructor(raw_emote_string : string) {
		const [id, ranges_string] = raw_emote_string.split(":");
		const ranges = ranges_string.split(",").map((range) => {
		const [start, end] = range.split("-").map((n) => Number(n));

		return { start: start, end: end };
	});

	this.id = id;
	this.ranges = ranges;
	}
}

const convert_emote_string_to_emotes = (
	emote_string: string
): Emote[] | undefined => {
	if (emote_string === "") return undefined;

	const emotes = emote_string.split("/").map((emote) => new Emote(emote));

	return emotes.length > 0 ? emotes : undefined;
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
				src={`https://static-cdn.jtvnw.net/emoticons/v2/${r.id}/static/dark/1.0`}
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

export { convert_emote_string_to_emotes, insert_emotes };
