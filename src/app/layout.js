import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata = {
  title: "L'Événement",
  description: "Partagez vos photographies.",
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
