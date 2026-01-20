"use client";
import ClientPage from "@/components/ClientPage";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white">
            <h1 className="text-4xl font-bold text-black">Hello World</h1>
            <ClientPage />
        </main>
    );
}
