export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/operator/', '/portal/', '/api/', '/master/', '/fundraising/'],
    },
    sitemap: 'https://ymccvii.com/sitemap.xml',
  };
}
