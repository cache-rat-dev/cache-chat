import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface AccessTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: Array<string>;
	token_type: string;
}

export const GET = async (request: Request) => {
	const cookieStore = await cookies();

	const { searchParams } = new URL(request.url);
	const clientId = process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? "";
	const clientSecret = process.env.NEXT_PUBLIC_TWITCH_APP_SECRET ?? "";
	const oauthCode = searchParams.get("code") ?? "";

	// 1. Pass parameters directly to URLSearchParams to avoid object typing issues
	const payload = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code: oauthCode,
		grant_type: "authorization_code",
		redirect_uri: "http://localhost:3000"
	});

	let resp = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: payload.toString()
	});

	if (resp.status === 401) {
		resp = await refreshToken();
	}

	if (!resp.ok) {
		throw new Error(
			`[AUTH] Error getting token: HTTP ${resp.status} ${await resp.text()}`
		);
	}

	const token: AccessTokenResponse = await resp.json();

	cookieStore.set("access_token", token.access_token, { maxAge: 86400 * 14 });
	cookieStore.set("refresh_token", token.refresh_token, {
		maxAge: 86400 * 14
	});

	// Next.js redirect must be called outside any try/catch blocks
	redirect("/");
};

const refreshToken = async () => {
	const cookieStore = await cookies();

	const clientId = process.env.NEXT_PUBLIC_TWITCH_APP_ID ?? "";
	const clientSecret = process.env.NEXT_PUBLIC_TWITCH_APP_SECRET ?? "";

	const payload = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: "refresh_token",
		refresh_token: cookieStore.get("refresh_token")?.value ?? ""
	});

	// 2. Fixed missing method: 'POST'
	const resp = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: payload.toString()
	});

	if (!resp.ok) {
		throw new Error(
			`[AUTH] Error getting refreshed access token: HTTP ${resp.status} ${await resp.text()}`
		);
	}

	// Returning a fresh Response object mimicking the original structure for the GET handler flow
	return resp;
};
