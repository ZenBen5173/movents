import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@electric-sql/pglite", "exceljs", "nodemailer", "postgres"],
};

export default nextConfig;
