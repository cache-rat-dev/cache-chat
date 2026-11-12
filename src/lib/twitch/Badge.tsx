export interface IBadge {
	set_id: string;
	versions: {
		id: string;
		image_url_1x: string;
		image_url_2x: string;
		image_url_4x: string;
		title: string;
		description: string;
		click_action: string;
		click_url: string;
	}[];
}

export const get_global_badges = async (access_token: string) => {
	const resp = await fetch(
		`https://api.twitch.tv/helix/chat/badges/global`,
		{
			headers: {
				"Authorization": `Bearer ${access_token}`,
				"Client-Id": process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? ""
			}
		}
	);

	if (!resp.ok) {
		throw new Error(
			`[BADGES] Error getting Global Badges: HTTP ${resp.status} ${await resp.text()}`
		);
	}

	return await resp.json();

}

export const get_channel_badges = async (broadcaster_id: string, access_token: string) => {
	const resp = await fetch(
		`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcaster_id}`,
		{
			headers: {
				"Authorization": `Bearer ${access_token}`,
				"Client-Id": process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? ""
			}
		}
	);

	if (!resp.ok) {
		throw new Error(
			`[BADGES] Error getting Channel Badges: HTTP ${resp.status} ${await resp.text()}`
		);
	}

	return await resp.json();
};
