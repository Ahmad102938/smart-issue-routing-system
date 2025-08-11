/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Removed for server mode
    swcMinify: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: { unoptimized: true },
};

module.exports = nextConfig;