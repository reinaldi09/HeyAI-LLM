/** @type {import('next').NextConfig} */
const nextConfig = {
  // Wajib untuk Dockerfile multi-stage agar menghasilkan output standalone
  output: "standalone",
};

export default nextConfig;
