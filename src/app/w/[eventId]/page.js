import Upload from "../../../components/upload";
import Gallery from "../../../components/gallery";

export default async function EventPage({ params }) {
  const { eventId } = await params;
  
  const eventName = "Madelle & Hugues";
  const eventDate = "30.05.2026";

  return (
    <main className="min-h-screen flex flex-col pt-36 relative">
      
      {/* ── Navbar flottante simple et épurée ── */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-6xl glass-nav px-8 py-5 rounded-3xl flex flex-col justify-center items-center animate-slide-down shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/[0.08]">
        <h1 className="text-2xl sm:text-3xl font-space font-bold tracking-tight text-gold-animated">
          {eventName}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-gray-400 font-outfit uppercase tracking-[0.3em]">
          {eventDate}
        </p>
      </header>
      
      {/* ── Contenu principal ── */}
      <div className="flex-grow mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 pb-24 space-y-24">

        {/* Héro texte */}
        <div className="text-center max-w-2xl mx-auto animate-fade-up" style={{animationDelay:'0.2s'}}>
          <p className="text-lg sm:text-xl text-gray-400 font-outfit font-light leading-relaxed">
            Immortalisez la grâce de cet instant.
            <br className="hidden sm:block"/>
            Chaque cliché devient un souvenir partagé.
          </p>
        </div>

        {/* Bloc Upload */}
        <section className="animate-fade-up" style={{animationDelay:'0.35s'}}>
          <Upload eventId={eventId} />
        </section>
        
        {/* Séparateur décoratif */}
        <div className="flex justify-center items-center gap-4 animate-fade-in" style={{animationDelay:'0.5s'}}>
          <div className="flex-1 max-w-[200px] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-white/10"/>
          <div className="w-1.5 h-1.5 bg-white/30 rotate-45 animate-pulse-slow"/>
          <div className="flex-1 max-w-[200px] h-[1px] bg-gradient-to-l from-transparent via-white/20 to-white/10"/>
        </div>

        {/* Galerie */}
        <section className="animate-fade-up" style={{animationDelay:'0.5s'}}>
          <Gallery eventId={eventId} />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-700 font-outfit">Héritage Visuel · 2026</p>
      </footer>
    </main>
  );
}
