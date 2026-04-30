/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/restaurant/le-caf-louis-vuitton',
        destination: '/restaurant/le-cafe-louis-vuitton',
        permanent: true,
      },
      {
        source: '/restaurant/casino',
        destination: '/restaurant/casino-new-york',
        permanent: true,
      },
      {
        source: '/restaurant/sushi-katsuei',
        destination: '/restaurant/sushi-katsuei-west-village',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
