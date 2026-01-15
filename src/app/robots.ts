import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scholarship.ncuesa.org.tw';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/manage/', '/auth/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
