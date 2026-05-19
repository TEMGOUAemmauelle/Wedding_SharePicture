import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 overflow-hidden">

      {/* Orbs ambiants */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay:'0s'}}/>
        <div className="absolute top-2/3 right-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay:'2s'}}/>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-white/[0.03] rounded-full blur-2xl animate-pulse-slow" style={{animationDelay:'1s'}}/>
      </div>

      <div className="max-w-xl w-full text-center relative z-10">

        {/* Titre */}
        <div className="animate-fade-up" style={{animationDelay:'0.1s'}}>
          <h1 className="text-6xl sm:text-8xl font-space font-bold tracking-tighter text-gold-animated leading-none">
            Wedding.
          </h1>
        </div>

        {/* Alliances juste en dessous du titre — espace réduit */}
        <div className="flex justify-center mt-4 mb-4 animate-fade-up" style={{animationDelay:'0.2s'}}>
          <div className="relative w-10 h-10 sm:w-12 sm:h-12">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow opacity-60">
              <circle cx="35" cy="50" r="22" fill="none" stroke="url(#g1)" strokeWidth="5"/>
              <circle cx="65" cy="50" r="22" fill="none" stroke="url(#g1)" strokeWidth="5"/>
              <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#BF953F"/>
                  <stop offset="50%" stopColor="#FCF6BA"/>
                  <stop offset="100%" stopColor="#AA771C"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Séparateur or */}
        <div className="flex justify-center items-center gap-3 mb-5 animate-fade-up" style={{animationDelay:'0.25s'}}>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/60"/>
          <div className="w-1.5 h-1.5 bg-[#D4AF37]/80 rotate-45"/>
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/60"/>
        </div>

        {/* Slogan */}
        <div className="mb-8 animate-fade-up" style={{animationDelay:'0.35s'}}>
          <p className="text-base sm:text-xl text-gray-300 font-outfit font-light leading-relaxed">
            L'éclat d'un instant,<br className="hidden sm:block" />
            où l'amour de{" "}
            <span className="text-white font-medium">Madelle&nbsp;&amp;&nbsp;Hugues</span>
            {" "}se grave pour l'éternité.
          </p>
        </div>

        {/* Boutons */}
        <div className="space-y-3 max-w-sm mx-auto font-outfit animate-fade-up" style={{animationDelay:'0.5s'}}>
          <Link
            href="/w/abc123"
            className="group relative block py-4 px-6 w-full rounded-full bg-white text-black font-bold text-lg transition-all duration-300 active:scale-[0.97] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            <span className="relative z-10 group-hover:tracking-wider transition-all duration-500">
              Découvrir l'Expérience →
            </span>
          </Link>
          
          <Link
            href="/admin/create-event"
            className="block py-4 px-6 w-full rounded-full bg-transparent border border-white/15 text-gray-400 font-medium text-base hover:bg-white/5 hover:text-white hover:border-white/30 transition-all duration-300 active:scale-[0.98]"
          >
            Accès Privilège (Admin)
          </Link>
        </div>

        {/* Date */}
        <p className="mt-8 text-[10px] uppercase tracking-[0.4em] text-gray-700 animate-fade-up" style={{animationDelay:'0.7s'}}>
          30 · 05 · 2026
        </p>
      </div>
    </div>
  );
}
