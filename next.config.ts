import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@electric-sql/pglite", "exceljs", "nodemailer", "postgres"],
  // The poster renderer reads these at runtime; make sure Vercel ships them.
  outputFileTracingIncludes: {
    "/api/creatives/[id]/image": [
      "./node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff",
      "./node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff",
      "./node_modules/@fontsource/space-mono/files/space-mono-latin-700-normal.woff",
    ],
  },
};

export default nextConfig;
