import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/admin", destination: "/account/profile", permanent: false },
      { source: "/account", destination: "/account/profile", permanent: false },
      {
        source: "/roles",
        destination: "/account/roles-and-permissions",
        permanent: false,
      },
      {
        source: "/account/roles",
        destination: "/account/roles-and-permissions",
        permanent: false,
      },
      {
        source: "/account/permissions",
        destination: "/account/roles-and-permissions",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
