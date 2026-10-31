export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khetandentalcarehelp.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/book"],
      disallow: ["/admin/", "/doctor/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
