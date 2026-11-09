export class Emote {
	id: string;
	url: string;
	ranges: { start: number; end: number }[];

	constructor(raw: string) {
		let ranges_string;
		[this.id, ranges_string] = raw.split(":");
		this.url = `https://static-cdn.jtvnw.net/emoticons/v2/${this.id}/default/dark/1.0`;
		this.ranges = ranges_string.split(",").map((r) => {
			const [start, end] = r.split("-").map((n) => Number(n));

			return { start: start, end: end };
		});
	}
}
