"use client";

import { ChatProvider } from "@/lib/twitch/ChatProvider";

import { Fallback } from "./landing";
import { Metadata } from "next";
import { useSearchParams } from "next/navigation";

export function Wrapper({ children }: { children: React.ReactNode }) {
	const params = useSearchParams();
	const channel = params.get("channel") ?? "";

	if (channel) {
		return <ChatProvider channel={channel}>{children}</ChatProvider>;
	} else {
		return <Fallback />;
	}
}
