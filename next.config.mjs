/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  async rewrites() {
    const apiUrl = process.env.PY_API_URL || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");
    if (!apiUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
