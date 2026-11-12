/**
 * @module Message
 */
import { Emote } from "./Emote";

export class Message {
	meta: Record<string, any> = {};
	badges!: string[];
	type: string;
	rawContent: string;
	content!: React.ReactNode[] | string

	private constructor(raw: string) {
		const spaceIdx = raw.indexOf(" ");
		const rawMeta = raw.slice(0, spaceIdx).trim();
		const rest = raw.slice(spaceIdx).trim();

		const splitContent = rest.split(":").filter((c) => c !== "");
		this.type = splitContent[0].split(" ")[1];
		this.rawContent = splitContent.slice(1).join(":");

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
			this.badges = this.meta.badges.split(",");

			this.meta.emotes = this.meta.emotes
				? this.meta.emotes.split("/").map((e: string) => new Emote(e))
				: undefined;

			if (!this.meta.emotes) {
				this.content = this.rawContent;
			} else {
				const replacements = this.meta.emotes.flatMap((e: Emote) =>
					e.ranges
						.map((r) => ({
							start: r.start,
							end: r.end,
							id: e.id,
							url: e.url
						}))
						.sort((a, b) => a.start - b.start)
				);

				const els: React.ReactNode[] = [];
				let lastIdx = 0;

				replacements.forEach(
					(
						r: {
							start: number;
							end: number;
							id: string;
							url: string;
						},
						idx: number
					) => {
						if (r.start > lastIdx) {
							els.push(<span>{this.rawContent.slice(lastIdx, r.start)}</span>);
						}

						els.push(
							<img
								key={`${r.id}-${idx}`}
								src={r.url}
								alt={this.rawContent.slice(r.start, r.end + 1)}
							/>
						);

						lastIdx = r.end + 1;
					}
				);

				if (lastIdx < this.rawContent.length) {
					els.push(<span>{this.rawContent.slice(lastIdx)}</span>);
				}

				this.content = els;
			}
		}
	}

	static fromRaw(raw: string): Message | null {
		if (!raw.includes("ROOMSTATE") && !raw.includes("PRIVMSG")) {
			return null;
		}
		return new Message(raw);
	}
}
