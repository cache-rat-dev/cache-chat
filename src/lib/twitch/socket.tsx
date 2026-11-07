"use client";

import { useEffect, useState } from "react";

const ChatSocket = () => {
	const [messages, setMessages] = useState<{ username: string; message: string;}[]>([]);

	useEffect(() => {
		let socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

		const handle_message = (event: any) => {
			if (event.startsWith('PING')) {
				socket.send('PONG :tmi.twitch.tv')
				return
			}

			if (event.includes('PRIVMSG')) {
				// const username = event.split('!')[0].replace(':', '')
				// const message = event.split('PRIVMSG #kaicenat :')[1].trim()

				// setMessages((prev) => [...prev.slice(-49), { username, message }]);
				setMessages((prev) => [...prev.slice(-49), { username: '', message: event.replace(':', '__________') }])
			}
		};

		socket.onopen = () => {
			console.log(`[SOCK] Connected`);
			socket.send('CAP REQ :twitch.tv/tags')
			socket.send('NICK justinfan22243');
			socket.send(`JOIN #kaicenat`)
		};

		socket.onmessage = (event) => {
			handle_message(event.data);
		};

		socket.onclose = (event) => {
			console.warn(`[SOCK] Closed: ${event.reason}`);
		};

		return () => socket.close();
	}, []);

	return (
		<div>
			{messages.map((message, idx) => (
				<p key={idx}>{message.message}</p>
			))}
		</div>
	);
};

export default ChatSocket;
