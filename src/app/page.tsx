import { Suspense } from "react";

import Chat from "./Chat";
import { Metadata } from "next";
import { connection } from "next/server";

export const instant = false;

type Props = { searchParams: Promise<{ channel: string }> };

export async function generateMetadata({
	searchParams
}: Props): Promise<Metadata> {
	const { channel } = await searchParams;

	if (!channel)
		return {
			title: "Cache Chat, by Cache Rat",
			description:
				"Windows 98 styled chat source for Twitch channels. Free, too!",
			openGraph: {
				title: "Cache Chat, by Cache Rat",
				description:
					"Windows 98 styled chat source for Twitch channels. Free, too!",
				siteName: "Cache Rat",
				images: [
					{
						url: "https://chat.cacherat.dev/cached_file_thumbnail.png",
						width: 101,
						height: 101,
						alt: "Cache Chat Thumbnail"
					}
				]
			},
			twitter: {
				card: "summary",
				title: "Cache Chat, by Cache Rat",
				description:
					"Windows 98 styled chat source for Twitch channels. Free, too!",
				images: ["https://chat.cacherat.dev/cached_file_thumbnail.png"]
			}
		};

	return {
		title: `${channel}'s Cache Chat, by Cache Rat`,
		description:
			"Windows 98 styled chat source for Twitch channels. Free, too!",
		openGraph: {
			title: `${channel}'s Cache Chat, by Cache Rat`,
			description:
				"Windows 98 styled chat source for Twitch channels. Free, too!",
			siteName: "Cache Rat",
			images: [
				{
					url: "https://chat.cacherat.dev/cached_file_thumbnail.png",
					width: 101,
					height: 101,
					alt: "Cache Chat Thumbnail"
				}
			]
		},
		twitter: {
			card: "summary",
			title: "Cache Chat, by Cache Rat",
			description:
				"Windows 98 styled chat source for Twitch channels. Free, too!",
			images: ["https://chat.cacherat.dev/cached_file_thumbnail.png"]
		}
	};
}

async function DynamicMarker() {
	await connection();
	return null;
}

export default function Page() {
	return (
		<>
			<Chat />
			<Suspense fallback={<div>Loading Chat...</div>}>
				<DynamicMarker />
			</Suspense>
		</>
	);
}
