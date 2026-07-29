import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/azeroth-guide-hub-zh-tw" : undefined,
  assetPrefix: isGitHubPages ? "/azeroth-guide-hub-zh-tw/" : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    // The Pages export does not use the Cloudflare-only D1 adapter.
    ignoreBuildErrors: isGitHubPages,
  },
};

export default nextConfig;
