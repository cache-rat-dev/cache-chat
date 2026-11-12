import { useState } from "react";

export const Fallback = () => {
	const [username, setUsername] = useState("");
	const [copied, setCopied] = useState(false);

	const handleCopy = async (event: React.SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			await navigator.clipboard.writeText(
				`https://chat.cacherat.dev?channel=${username.toLowerCase()}`
			);
			setCopied(true);
			setTimeout(() => setCopied(false), 1000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<div className="splash">
			<div className="message_container" style={{ maxWidth: 500 }}>
				<div
					className="name_and_badges"
					style={{
						background:
							"linear-gradient(to right, hsl(240 100% 25%), hsl(240 100% 41%))"
					}}
				>
					<img src="/cached_file.png" alt="cacheraFile" />
					<span>Cache Chat, by cache_rat</span>
				</div>
				<div className="content">
					Hi! This is Cache Chat. Cache Chat is designed to be
					reminiscent of Windows 98 style windows, with simple
					integration for emotes and badges.
				</div>
			</div>
			<div className="message_container" style={{ maxWidth: 500 }}>
				<div
					className="name_and_badges"
					style={{
						background:
							"linear-gradient(to right, hsl(40, 100%, 25%), hsl(40 100% 41%))"
					}}
				>
					<img src="/cached_file.png" alt="cacheraFile" />
					<span>Can I Use This for my Streams?</span>
				</div>
				<div className="content">
					Sure! Type your Twitch username into the box below and press
					the cacheraPog to copy a Browser Source URL to your
					clipboard that you can use in your streaming software of
					choice.
					<form className={`form`} onSubmit={handleCopy}>
						{copied ? (
							<input
								type="text"
								value="Copied!"
								disabled
								className="copied"
							/>
						) : (
							<input
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="cache_rat"
							/>
						)}
						<button type="submit">
							<img src="/cacheraPog.png" alt="cacheraPog" />
						</button>
					</form>
				</div>
			</div>
			<div className="message_container" style={{ maxWidth: 500 }}>
				<div
					className="name_and_badges"
					style={{
						background:
							"linear-gradient(to right, hsl(140, 100%, 25%), hsl(140 100% 41%))"
					}}
				>
					<img src="/cached_file.png" alt="cacheraFile" />
					<span>Do I Have To Give Credit?</span>
				</div>
				<div className="content">
					I'd love it if you did. Could be as simple as linking my
					Twitch Channel in your bio (
					<a href="https://twitch.tv/cache_rat" target="_blank">
						https://twitch.tv/cache_rat
					</a>
					). Making stuff is my passion, I'd love to be seen for it.
				</div>
			</div>
			<div className="message_container" style={{ maxWidth: 500 }}>
				<div
					className="name_and_badges"
					style={{
						background:
							"linear-gradient(to right, hsl(300, 100%, 25%), hsl(300 100% 41%))"
					}}
				>
					<img src="/cached_file.png" alt="cacheraFile" />
					<span>I Experienced A Bug!</span>
				</div>
				<div className="content">
					You can reach me through my{" "}
					<a href="https://discord.gg/2aQ9ET7zv4" target="_blank">
						Discord
					</a>
					. Let me know what the problem was, and I'll add it to my
					laundry list of things to do.
				</div>
			</div>
		</div>
	);
};
