"use client";

import { CSSProperties } from "react";

import { useChat } from "@/hooks/useChat";

function hexToRgb(hex: string) {
	// Remove the hash symbol if present
	let cleanHex = hex.replace(/^#/, "");

	// Expand 3-digit shorthand (e.g., "03F") to 6-digit ("0033FF")
	if (cleanHex.length === 3) {
		cleanHex = cleanHex
			.split("")
			.map((char) => char + char)
			.join("");
	}

	// Parse each 2-character pair from base-16 to base-10
	const r = parseInt(cleanHex.slice(0, 2), 16);
	const g = parseInt(cleanHex.slice(2, 4), 16);
	const b = parseInt(cleanHex.slice(4, 6), 16);

	return { r, g, b }; // Or return `rgb(${r}, ${g}, ${b})`
}

function rgbToHue(r: number, g: number, b: number) {
	// 1. Normalize RGB values to the 0–1 range
	r /= 255;
	g /= 255;
	b /= 255;

	// 2. Find the maximum and minimum channel values and their difference (chroma)
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;

	// 3. If delta is 0, the color is a shade of gray (achromatic), so hue is 0
	if (delta === 0) {
		return 0;
	}

	let hue;

	// 4. Calculate hue based on which channel is the maximum
	if (max === r) {
		hue = ((g - b) / delta) % 6;
	} else if (max === g) {
		hue = (b - r) / delta + 2;
	} else {
		hue = (r - g) / delta + 4;
	}

	// 5. Convert to degrees (0–360) and ensure a positive result
	hue = Math.round(hue * 60);
	if (hue < 0) {
		hue += 360;
	}

	return hue;
}

const css_gradient = (color: string) => {
	if (color === "") color = "#ff0000";
	const { r, g, b } = hexToRgb(color);
	const hue = rgbToHue(r, g, b);

	// return { '--gradient-stop-1': `hsl(${hue} 100% 25%)`, '--gradient-stop-2': `hsl(${hue - 36} 100% 41%)`} as CSSProperties
	return {
		background: `linear-gradient(to right, hsl(${hue} 100% 25%), hsl(${hue} 100% 41%))`
	} as CSSProperties;
	// return { 'background': `hsl(${hue} 100% 50%`}
};

const Chat = () => {
	const { messages, badges } = useChat();

	const get_badge = (badge_string: string, index: number) => {
		if (badge_string == "") return null;
		let [id, version] = badge_string.split("/");
		let url;
		try {
			url = badges[id]?.versions.filter((v) => v.id == version)[0]
				.image_url_1x;
		} catch {
			url = undefined;
		}

		return <img key={`${badge_string}-${index}`} src={url} />;
	};

	return (
		<div className="wrapper">
			{messages.map((m, msgIndex) => (
				<div
					key={`${m.meta?.id || "msg"}-${msgIndex}`}
					className="message_container"
				>
					<div
						style={css_gradient(m.meta?.color)}
						className="name_and_badges"
					>
						{m.badges.map((badge, badgeIndex) =>
							get_badge(badge, badgeIndex)
						)}{" "}
						<span>{m.meta?.["display-name"]}</span>
					</div>
					<div className="content">{m.content}</div>
				</div>
			))}
		</div>
	);
};

export default Chat;
