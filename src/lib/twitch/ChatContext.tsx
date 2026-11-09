"use client";

import { createContext } from "react";

import { Message } from "./Message";

interface IChatContext {
	messages: Message[];
	badges: Record<string, any>;
	broadcasterID: string;
}

export const ChatContext = createContext<IChatContext | null>(null);
