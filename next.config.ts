import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/", destination: "/index.html" },
      { source: "/about", destination: "/about.html" },
      { source: "/services", destination: "/services.html" },
      { source: "/book", destination: "/book.html" },
      { source: "/contact", destination: "/contact.html" },
    ];
  },
};

export default nextConfig;
