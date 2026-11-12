export const get_access_token = () => {
	return fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? "",
			client_secret: process.env.NEXT_PUBLIC_TWITCH_APP_SECRET ?? "",
			grant_type: "client_credentials"
		}).toString()
	}).then((response) => {
		if (!response.ok) {
			throw new Error(
				`[AUTH] Error getting access token: HTTP ${response.status}`
			);
		}

		return response.json();
	});
};
