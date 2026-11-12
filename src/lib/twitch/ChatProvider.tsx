/**
 * @module ChatProvider
 */
"use client";

import { useEffect, useRef, useState } from "react";

import { ChatContext } from "@/lib/twitch/ChatContext";
import { Message } from "@/lib/twitch/Message";

import { get_access_token } from "./Auth";
import { get_channel_badges, get_global_badges, IBadge } from "./Badge";

/**
 * Wrapper that provides/exposes variables regarding a Twitch chat (eg. chat messages, emotes, badges)
 * @param {string} channel - Username of the channel whose chat you're watching.
 * @returns
 */
export const ChatProvider: React.FC<{
	channel: string;
	children: React.ReactNode;
}> = ({ channel, children }) => {
	const [hasToken, setHasToken] = useState(false);
	const [hasGlobalBadges, setHasGlobalBadges] = useState(false);
	const [hasChannelBadges, setHasChannelBadges] = useState(false);

	const [messages, setMessages] = useState<Message[]>([]); // bank for messages
	const [badges, setBadges] = useState<Record<string, IBadge>>({}); // bank for badges
	const [token, setToken] = useState<string>(""); // bank for token
	const [broadcasterID, setBroadcasterID] = useState<string>(""); // bank for broadcaster id

	const socketRef = useRef<WebSocket | null>(null); // reference to the chat's websocket

	// get access token
	useEffect(() => {
		let noToken = true;

		get_access_token()
			.then((t) => {
				if (noToken) setToken(t.access_token);
			})
			.catch((err) => console.error(err));

		return () => {
			noToken = false;
			setHasToken(true);
		};
	}, []);

	useEffect(() => {
		if (!token) return;

		get_global_badges(token).then((globBadges) => {
			const badgeList = Array.isArray(globBadges)
				? globBadges
				: globBadges?.data;
			badgeList.forEach((badge: IBadge) => {
				setBadges((prevBadges) => ({
					...prevBadges,
					[badge.set_id]: badge
				}));
			});
			setHasGlobalBadges(true);
		});
	}, [token]);

	useEffect(() => {
		if (!token || !broadcasterID || !hasGlobalBadges) return;

		get_channel_badges(broadcasterID, token).then((chanBadges) => {
			const badgeList = Array.isArray(chanBadges)
				? chanBadges
				: chanBadges?.data;
			badgeList.forEach((badge: IBadge) => {
				setBadges((prevBadges) => ({
					...prevBadges,
					[badge.set_id]: badge
				}));
			});
			setHasChannelBadges(true);
		});
	}, [token, broadcasterID, hasGlobalBadges]);

	// get socket
	useEffect(() => {
		if (!channel) return; // if no channel name was provided, fail out. nothing to do here

		const sock = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
		socketRef.current = sock; // create and set reference to websocket

		/* ON OPEN:
		 *  send commands to request capabilities for twitch tags and commands
		 *  set nickname to justinfan22243 (cache on the numpad)
		 *  join the chat channel of the broadcaster
		 */
		sock.onopen = () => {
			console.log(`[SOCK] Connected`);
			sock.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
			sock.send("NICK justinfan22243");
			sock.send(`JOIN #${channel}`);
		};

		/* ON MESSAGE:
		 *  If it's a ping, return the pong. Move on.
		 *  Split the message into its individual lines - sometimes it sends multiple lines at once.
		 *  If the message type is ROOMSTATE, use it to set the broadcaster ID
		 *  If the message type is PRIVMSG, add it to the messages bank.
		 */
		sock.onmessage = (event) => {
			const raw = String(event.data);
			if (raw.startsWith("PING")) {
				sock.send("PONG :tmi.twitch.tv");
				return;
			}

			const lines = raw.split("\r\n");
			for (const line of lines) {
				const parsed = Message.fromRaw(line);
				if (!parsed) continue;

				if (parsed.type === "ROOMSTATE" && parsed.meta["room-id"]) {
					setBroadcasterID(parsed.meta["room-id"]);
				} else if (parsed.type === "PRIVMSG") {
					setMessages((prev) => [...prev.slice(-29), parsed]);
				}
			}
		};

		return () => sock.close();
	}, [channel]);

	return (
		<ChatContext.Provider
			value={{ messages, token, badges, broadcasterID }}
		>
			{children}
		</ChatContext.Provider>
	);
};
