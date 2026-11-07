"use client";

import { useEffect } from "react";

const ChatSocket = () => {
	useEffect(() => {
		let socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

		const handle_message = (event: any) => {
			if (event.startsWith('PING')) {
				socket.send('PONG :tmi.twitch.tv')
				return
			}

			if (event.includes('PRIVMSG')) {
				const username = event.split('!')[0].replace(':', '')
				const message = event.split('PRIVMSG #shenpai :')[1].trim()

				console.log(`${username}: ${message}`)
			}
		};

		socket.onopen = () => {
			console.log(`[SOCK] Connected`);
			// socket.send('CAP REQ :twitch.tv/tags')
			socket.send('NICK justinfan22243');
			socket.send(`JOIN #shenpai`)
		};

		socket.onmessage = (event) => {
			handle_message(event.data);
		};

		socket.onclose = (event) => {
			console.warn(`[SOCK] Closed: ${event.reason}`);
		};

		return () => socket.close();
	}, []);

	return null;
};

export default ChatSocket;
