export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/operator/', '/portal/', '/api/'],
    },
    sitemap: 'https://ymccvii.com/sitemap.xml',
  };
}
