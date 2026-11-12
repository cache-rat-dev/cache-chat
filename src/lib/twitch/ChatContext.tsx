/**
 * @module ChatContext
 */
"use client";

import { createContext } from "react";

import { Message } from "@/lib/twitch/Message";

import { IBadge } from "./Badge";

/**
 * Defines variables that will be used across the Chat Source code.
 */
export interface IChatContext {
	messages: Message[];
	token: string;
	badges: Record<string, IBadge>;
	broadcasterID: string;
}

/**
 * Method for providing a ChatContext.
 */
export const ChatContext = createContext<IChatContext | null>(null);
