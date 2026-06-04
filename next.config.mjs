import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mcpServer: false
  },
  async redirects() {
    return [
      {
        source: "/events/:id/races/:raceId",
        destination: "/races/:raceId",
        permanent: true
      },
      {
        source: "/events/:id",
        destination: "/meets/:id",
        permanent: true
      },
      {
        source: "/events",
        destination: "/meets",
        permanent: true
      }
    ];
  },
  turbopack: {
    root: projectRoot
  }
};

export default nextConfig;
