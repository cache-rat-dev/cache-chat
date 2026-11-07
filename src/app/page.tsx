import { retrieveAccessToken } from "@/lib/twitch";

export const instant = false

const Chat = async () => {
	const token = await retrieveAccessToken();

	return (
		<>{token}</>
	);
}

export default Chat;