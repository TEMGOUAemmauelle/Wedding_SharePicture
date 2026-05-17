"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db, auth, loginAnonymously } from "../lib/firebase";

export default function Gallery({ eventId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    const setupListener = async () => {
      try {
        if (!auth.currentUser) await loginAnonymously();
        const q = query(
          collection(db, "photos"),
          where("eventId", "==", eventId),
          orderBy("createdAt", "desc")
        );
        unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedPhotos = snapshot.docs.map((doc) => ({
            _docId: doc.id,
            ...doc.data(),
          }));
          setPhotos(fetchedPhotos);
          setLoading(false);
        });
      } catch (err) {
        console.error(err); setLoading(false);
      }
    };
    setupListener();
    return () => unsubscribe();
  }, [eventId]);

  const handleDelete = async (docId) => {
    if (confirm("Supprimer cette photo ?")) {
        await deleteDoc(doc(db, "photos", docId));
    }
  };

  const toggleModeration = () => {
    if (isModerator) return setIsModerator(false);
    if (prompt("Code d'accès modérateur :") === "maries2026") setIsModerator(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-full font-outfit relative">
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-white/10">
        <div className="flex flex-col items-start mb-6 sm:mb-0">
          <h2 className="text-3xl font-space font-bold tracking-tight text-gold uppercase tracking-widest">Galerie</h2>
          <span className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">
            {photos.length} photos téléchargées
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {photos.length > 0 && (
            <button
              onClick={() => alert("Archive en cours de création...")}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold py-2 px-5 rounded-full transition-all uppercase tracking-widest"
            >
              Tout télécharger
            </button>
          )}
          <button
            onClick={toggleModeration}
            className={`text-xs font-bold transition-colors px-4 py-2 border rounded-full uppercase tracking-widest ${
              isModerator ? "bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30" : "text-gray-400 border-gray-600 hover:text-white hover:border-white"
            }`}
          >
            {isModerator ? "Fermer Modération" : "Admin"}
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in relative border border-white/10">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">La galerie est vide.<br/><span className="text-white mt-2 block">Soyez le premier à ajouter une photo.</span></p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {photos.map((photo, i) => (
            <div 
              key={photo._docId} 
              className="relative group break-inside-avoid animate-fade-up overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-lg"
              style={{ animationDelay: `${Math.min(i * 0.05, 1)}s` }}
            >
              <img
                src={photo.url}
                alt="Souvenir"
                className="w-full transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <div className="flex justify-between items-center w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center shadow-lg"
                  >
                     Agrandir
                  </a>
                  
                  {isModerator && (
                    <button
                      onClick={() => handleDelete(photo._docId)}
                      className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
                      title="Supprimer"
                    >
                      Détruire
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
