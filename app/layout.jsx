import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Khetan Dental Care | Dr. Prachi Khetan, Raha, Nagaon",
  description: "Advanced dental clinic in Raha, Nagaon, Assam offering dental implants, painless root canals, scaling, dentures, teeth whitening & orthodontic treatment with Dr. Prachi Khetan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-ink min-h-screen flex flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
