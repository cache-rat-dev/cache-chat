"use client";

import { useChat } from "@/hooks/useChat";

const Chat = () => {
	const { messages, badges } = useChat();

	const get_badge = (badge_string: string) => {
		let [id, version] = badge_string.split("/")
		let url = badges[id]?.versions.filter((v) => v.id == version)[0].image_url_1x

		return (
			<img key={`${id}-${version}`} src={url} />
		)
	}

	return (
		<div>
			{messages.map((m) => (
				<div key={m.meta?.id}>
					<span style={{ color: m.meta?.color }}>
						{m.badges.map(badge => get_badge(badge))}
						{" "}
						{m.meta?.["display-name"]}
					</span>
					: {m.content}
				</div>
			))}
		</div>
	);
};

export default Chat;
