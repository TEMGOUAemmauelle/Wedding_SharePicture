import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata = {
  title: "Madelle & Hugues",
  description: "L'éclat d'un instant, gravé pour l'éternité.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='35' cy='50' r='22' fill='none' stroke='%23D4AF37' stroke-width='7'/><circle cx='65' cy='50' r='22' fill='none' stroke='%23D4AF37' stroke-width='7'/></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${space.variable} scroll-smooth`}>
      <body className="bg-[#050505] font-outfit antialiased text-white selection:bg-white/20 overflow-x-hidden">

        {/* ── Fond ambiant animé ── */}
        <div className="fixed inset-0 pointer-events-none w-full h-full overflow-hidden -z-10">
          {/* Orb haut gauche */}
          <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] bg-zinc-800/30 rounded-full blur-[130px] animate-pulse-slow" style={{animationDelay:'0s'}}/>
          {/* Orb bas droite */}
          <div className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] bg-zinc-900/40 rounded-full blur-[130px] animate-pulse-slow" style={{animationDelay:'2.5s'}}/>
          {/* Fine ligne dorée en haut */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent"/>
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
