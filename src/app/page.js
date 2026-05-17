import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6">
      
      <div className="max-w-xl w-full text-center space-y-12 animate-fade-up">
        
        <div className="relative inline-block">
          <h1 className="text-6xl sm:text-7xl font-space font-bold tracking-tighter text-gold relative z-10 text-center">
            Weddind.
          </h1>
        </div>

        <div>
           <p className="text-lg sm:text-xl text-gray-300 font-outfit font-light leading-relaxed">
            L'éclat d'un instant,<br className="hidden sm:block" /> gravé pour l'éternité.
          </p>
        </div>

        <div className="space-y-5 pt-12 max-w-sm mx-auto font-outfit">
          <Link
            href="/w/abc123"
            className="block py-4 px-6 w-full rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all duration-300 active:scale-[0.98]"
          >
            Découvrir l'Expérience
          </Link>
          
          <Link
            href="/admin/create-event"
            className="block py-4 px-6 w-full rounded-full bg-[#0a0a0a] border border-white/20 text-gray-300 font-medium text-base hover:bg-white/10 hover:text-white transition-colors duration-300 active:scale-[0.98]"
          >
            Accès Privilège (Admin)
          </Link>
        </div>
      </div>
      
    </div>
  );
}
