"use client";

import { useSearchParams } from "next/navigation";

import "./globals.css";

import { Suspense } from "react";

import { ChatProvider } from "@/lib/twitch/ChatProvider";

export function Wrapper({ children }: { children: React.ReactNode }) {
	const params = useSearchParams();
	const channel = params.get("channel") ?? "";

	return <ChatProvider channel={channel}>{children}</ChatProvider>;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en">
			<body>
				<Suspense fallback={<div>Loading chat...</div>}>
					<Wrapper>{children}</Wrapper>
				</Suspense>
			</body>
		</html>
	);
}
