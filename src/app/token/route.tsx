import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface AccessTokenResponse extends Response {
	access_token: string,
	expires_in: number,
	refresh_token: string,
	scope: Array<string>,
	token_type: string
}

export const GET = async (request: Request) => {
	const cookieStore = await cookies()

	const { searchParams } = new URL(request.url)
	const clientId = process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? '';
	const clientSecret = process.env.NEXT_PUBLIC_TWITCH_APP_SECRET ?? '';
	const oauthCode = searchParams.get('code') ?? ''

	const payload = {
		client_id: clientId,
		client_secret: clientSecret,
		code: oauthCode,
		grant_type: 'authorization_code',
		redirect_uri: 'http://localhost:3000'
	}

	const resp = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams(payload).toString()
	});

	if (!resp.ok) { throw new Error(`[AUTH] Error getting token: HTTP ${resp.status} ${await resp.text()}`)}

	const token : AccessTokenResponse = JSON.parse(await resp.text())

	cookieStore.set('access_token', token.access_token, {
		maxAge: 86400 * 14
	})
	cookieStore.set('refresh_token', token.refresh_token, {
		maxAge: 86400 * 14
	})

	redirect('/')
}