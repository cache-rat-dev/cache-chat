/**
 * @module useChat
 */
import { useContext } from "react";

import { ChatContext } from "@/lib/twitch/ChatContext";

/**
 * Use this to create and return a {@link ChatContext.ChatContext} for a {@link ChatProvider.ChatProvider}.
 * @returns {ChatContext}
 */
export const useChat = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChat must be used inside a <ChatProvider>");
	}
	return context;
};
