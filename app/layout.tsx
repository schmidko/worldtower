import type { Metadata } from "next";
import "./globals.css";
import MiniKitProvider from "@/components/minikit-provider";

export const metadata: Metadata = {
    title: "World Tower",
    description: "Hello World App on World Chain",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased bg-white text-black min-h-screen flex flex-col items-center justify-center">
                <MiniKitProvider>
                    {children}
                </MiniKitProvider>
            </body>
        </html>
    );
}
