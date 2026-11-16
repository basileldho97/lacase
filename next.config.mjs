/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_SUPABASE_URL ? new URL(process.env.NEXT_SUPABASE_URL).hostname : '**';
const nextConfig = { images: { remotePatterns: [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] } };
export default nextConfig;
