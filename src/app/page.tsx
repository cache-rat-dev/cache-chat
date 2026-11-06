import ChatClient from "@/components/ChatClient";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const Chat = async () => {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get("access_token")?.value ?? "";

	if (accessToken == "") {
		redirect("/oauth");
	}

	return <ChatClient accessToken={accessToken} />;
};

export default Chat;
