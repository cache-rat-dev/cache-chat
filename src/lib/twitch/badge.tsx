/**
 * Logic for the handling of {@link IBadge Badges}.
 * @module badge
 */

import type { IBadge } from "@/lib/twitch/types";

export type { IBadge } from "@/lib/twitch/types";

/**
 * A Twitch Badge. It consists of the badge's ID and its version.
 */
export class Badge implements IBadge {
	public id!: string;
	public version!: string;

	/**
	 * Used if the ID and version are already known.
	 * @param id Badge ID
	 * @param version Badge Version
	 */
	constructor(id: string, version: string);

	/**
	 * Used if the ID and version have to be parsed from a raw badge string.
	 * @param raw_badge_string Raw badge string. Typically formatted as \<id>/\<version>.
	 */
	constructor(raw_badge_string: string);

	constructor(arg1: string, arg2?: string) {
		if (arg2 !== undefined) {
			this.id = arg1;
			this.version = arg2;
		} else {
			const parsed = this.handle_badge(arg1);
			this.id = parsed.id;
			this.version = parsed.version;
		}
	}

	private handle_badge(raw_badge_string: string) {
		const slash = raw_badge_string.indexOf("/");
		return slash === -1
			? { id: raw_badge_string, version: "" }
			: {
					id: raw_badge_string.slice(0, slash),
					version: raw_badge_string.slice(slash + 1)
				};
	}
}

/**
 * Parses a comma-separated badge string into {@link IBadge} objects.
 *
 * Each entry is split at `/` into ID and version. An entry without a `/` gets an empty string for a version.
 *
 * @param badge_string Raw badge list (eg. `"broadcaster/1,subscriber/12"`)
 * @returns The parsed badges, or `undefined` if `badge_string` is empty.
 *
 * @example
 * convert_badge_string_to_badges("subscriber/12,vip/1")
 * // [
 * //	Badge { id: "subscriber", version: "12" },
 * //	Badge { id: "vip", version: "1" }
 * // ]
 */
const convert_badge_string_to_badges = (
	badge_string: string
): Badge[] | undefined => {
	if (badge_string === "") return undefined;

	const badges = badge_string.split(",").map((badge) => new Badge(badge));

	return badges.length > 0 ? badges : undefined;
};

export { convert_badge_string_to_badges };
