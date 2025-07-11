/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Removed for server mode
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: { unoptimized: true },
};

module.exports = nextConfig;