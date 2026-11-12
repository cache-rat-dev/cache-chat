import "./globals.css";

import { Suspense } from "react";

import { Wrapper } from "./wrapper";

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
