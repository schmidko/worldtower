import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        APP_ENV: process.env.APP_ENV || 'testnet',
    },
    transpilePackages: ['@worldcoin/minikit-js', '@worldcoin/minikit-react', 'phaser'],
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'self';"
                    }
                ]
            }
        ];
    }
};

export default nextConfig;
