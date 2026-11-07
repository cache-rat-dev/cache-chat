interface TwitchAuthResponse extends Response {
	access_token: string,
	expires_in: number,
	token_type: string
}

const retrieveAccessToken = async () => {
	const payload = {
		client_id: process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? '',
		client_secret: process.env.NEXT_PUBLIC_TWITCH_APP_SECRET ?? '',
		grant_type: 'client_credentials'
	}

	const resp = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams(payload).toString()
	})

	if (!resp.ok) {
		throw new Error(`[AUTH] Failed getting access token: HTTP ${resp.status} ${await resp.text()}`)
	}

	return await resp.json().then((r) => {return r.access_token})
}

export { retrieveAccessToken };