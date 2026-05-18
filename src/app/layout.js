import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata = {
  title: "Madelle & Hugues",
  description: "L'éclat d'un instant, gravé pour l'éternité.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='40' cy='50' r='25' fill='none' stroke='%23D4AF37' stroke-width='8'/><circle cx='60' cy='50' r='25' fill='none' stroke='%23D4AF37' stroke-width='8'/></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${space.variable} scroll-smooth`}>
      <body className="bg-[#050505] font-outfit antialiased text-white selection:bg-white/20">
        
        {/* Subtle glowing radial background for an "épuré" effect */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-zinc-800/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-zinc-900/40 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
