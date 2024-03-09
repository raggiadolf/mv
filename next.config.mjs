/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
        port: "",
      },
    ],
  },
};

export default nextConfig;
