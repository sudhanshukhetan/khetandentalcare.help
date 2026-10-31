export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khetandentalcarehelp.vercel.app";
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
