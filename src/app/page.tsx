"use client";

import { useChat } from "@/hooks/useChat";

const Chat = () => {
	const { messages } = useChat();

	return (
		<div>
			{messages.map((m) => (
				<div key={m.meta?.id}>
					<span style={{ color: m.meta?.color }}>
						{m.meta?.["display-name"]}
					</span>
					: {m.content}
				</div>
			))}
		</div>
	);
};

export default Chat;
