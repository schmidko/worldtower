import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        APP_ENV: process.env.APP_ENV || 'testnet',
    },
    transpilePackages: ['@worldcoin/minikit-js', '@worldcoin/minikit-react']
};

export default nextConfig;
