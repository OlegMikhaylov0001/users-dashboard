import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: "export",

  // Trailing slash so /users/1 → /users/1/index.html (works on any static host)
  trailingSlash: true,

  // Set via NEXT_PUBLIC_BASE_PATH in CI.
  // For a project page (username.github.io/repo): set to "/repo-name"
  // For a user/org page (username.github.io):     leave empty
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? "",

  images: {
    // next/image optimisation requires a server; disable for static export
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dummyjson.com",
      },
    ],
  },
};

export default nextConfig;
