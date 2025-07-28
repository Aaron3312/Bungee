import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Ignorar errores de ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ignorar errores de TypeScript durante el build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;