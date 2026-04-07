import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "images.unsplash.com" },
      { protocol: "https" as const, hostname: "images.pexels.com" },
      { protocol: "http" as const, hostname: "localhost", port: "9000" },
      { protocol: "http" as const, hostname: "minio", port: "9000" },
    ],
  },
};

export default withNextIntl(nextConfig);
