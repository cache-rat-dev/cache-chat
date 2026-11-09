import { useContext } from "react";

import { ChatContext } from "@/lib/twitch/ChatContext";

export const useChat = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChat must be used inside a <ChatProvider>");
	}
	return context;
};
