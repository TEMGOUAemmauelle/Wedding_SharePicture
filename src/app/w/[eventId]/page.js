import Upload from "../../../components/upload";
import Gallery from "../../../components/gallery";

export default async function EventPage({ params }) {
  const { eventId } = await params;
  
  const eventName = "Madelle & Hugues";
  const eventDate = "30.05.2026";

  return (
    <main className="min-h-screen flex flex-col pt-32 relative">
      
      {/* Floating Modern Header with Gold Title and Date underneath */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[96%] max-w-6xl glass-nav px-8 py-5 rounded-3xl flex flex-col justify-center items-center animate-fade-in shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all h-auto border border-white/10">
        <h1 className="text-2xl sm:text-3xl font-space font-bold tracking-tight text-white m-0 text-center">
          <span className="text-gold">{eventName}</span>
        </h1>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white font-outfit uppercase tracking-[0.2em] font-medium text-center">
          {eventDate}
        </p>
      </header>
      
      <div className="flex-grow mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 pb-20 space-y-24 animate-fade-up mt-8">
        
        <div className="text-center max-w-2xl mx-auto mt-4">
          <p className="text-lg sm:text-xl text-gray-300 font-outfit font-light leading-relaxed">
            Immortalisez la grâce de cet instant. Tissez l'histoire de cette journée à travers vos objectifs.
          </p>
        </div>

        <section>
          <Upload eventId={eventId} />
        </section>
        
        {/* Subtle Decorative Divider monochrome */}
        <div className="flex justify-center opacity-40 items-center space-x-4">
          <div className="w-16 h-[1px] bg-gradient-to-l from-gray-400 to-transparent"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rotate-45"></div>
          <div className="w-16 h-[1px] bg-gradient-to-r from-gray-400 to-transparent"></div>
        </div>

        <section>
          <Gallery eventId={eventId} />
        </section>
      </div>

    </main>
  );
}
