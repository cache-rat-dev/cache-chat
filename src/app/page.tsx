import ChatClient from "@/components/ChatClient";

import { cookies } from "next/headers";

const Chat = async () => {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get("access_token")?.value ?? "";

	return <ChatClient accessToken={accessToken} />;
};

export default Chat;
