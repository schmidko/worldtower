"use client";
import dynamic from "next/dynamic";

const PhaserGame = dynamic(() => import("@/components/PhaserGame"), { ssr: false });

export default function Home() {
    return (
        <main style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            <PhaserGame />
        </main>
    );
}
