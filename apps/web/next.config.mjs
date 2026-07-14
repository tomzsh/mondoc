/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
    // Tree-shake barrel packages (smaller client graphs)
    optimizePackageImports: [
      "@phosphor-icons/react",
      "wagmi",
      "viem",
      "@tanstack/react-query",
    ],
  },
  /**
   * Cache policy that reduces ChunkLoadError after deploys:
   * - HTML / RSC documents: always revalidate (pick up new chunk hashes)
   * - Hashed static assets under /_next/static: long-lived immutable cache
   */
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source:
          "/((?!_next/static|_next/image|favicon.ico|brand/|monad-icon\\.svg).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };

    if (!isServer) {
      // Browser: allow slow networks / large first wallet compile
      config.output = {
        ...config.output,
        chunkLoadTimeout: 180_000,
      };

      /**
       * IMPORTANT: do NOT force a single named `web3-vendor` chunk.
       * That previously produced one ~24MB file → ChunkLoadError (timeout).
       * Keep Next defaults so wallet deps split into many parallel chunks.
       * maxAsyncRequests raised so many small web3 pieces can load together.
       */
      const prev = config.optimization?.splitChunks;
      if (prev && typeof prev === "object") {
        const prevGroups =
          typeof prev.cacheGroups === "object" && prev.cacheGroups
            ? { ...prev.cacheGroups }
            : {};
        // Drop any prior named mono group if present
        delete prevGroups.web3;

        config.optimization.splitChunks = {
          ...prev,
          maxAsyncRequests: 40,
          maxInitialRequests: 25,
          cacheGroups: prevGroups,
        };
      }
    }

    // Silence noisy optional peer in dev
    if (dev) {
      config.infrastructureLogging = { level: "error" };
    }

    return config;
  },
};

export default nextConfig;
