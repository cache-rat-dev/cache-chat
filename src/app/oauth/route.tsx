import { redirect } from "next/navigation";

const requestURL = `https://id.twitch.tv/oauth2/authorize` +
`?response_type=code` +
`&client_id=${process.env.NEXT_PUBLIC_TWITCH_APP_ID}` +
`&redirect_uri=http://localhost:3000/token` +
`&scope=user%3Aread%3Achat`

export const GET = async () => {
	redirect(requestURL)
}