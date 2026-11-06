import { cookies } from "next/headers";
import { Suspense } from "react";

const CookieView = async () => {
	const cookieStore = await cookies()

	return(
		<>{cookieStore.get('access_token')?.value}</>
	)
}

const Chat = () => {
	return(
		<Suspense fallback={'Waiting for cookies...'}><CookieView/></Suspense>
	)
}

export default Chat