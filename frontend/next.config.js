/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ["boaterra.clientes.atlas.autenlab.com"],
    },
  },
};

module.exports = nextConfig;
