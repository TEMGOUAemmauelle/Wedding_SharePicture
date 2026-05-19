"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db, auth, loginAnonymously } from "../lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Gallery({ eventId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  
  // Sélection (via long press)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  // Lightbox (vue plein écran)
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Long press timers
  const longPressTimers = useRef({});

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
          const fetchedPhotos = snapshot.docs.map((d) => ({ _docId: d.id, ...d.data() }));
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

  // Fermer lightbox avec touche Echap
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setLightboxPhoto(null); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* ---- LONG PRESS ---- */
  const handlePressStart = useCallback((docId) => {
    longPressTimers.current[docId] = setTimeout(() => {
      setSelectionMode(true);
      setSelectedPhotos(prev => new Set([...prev, docId]));
    }, 500); // 500ms = long press
  }, []);

  const handlePressEnd = useCallback((docId) => {
    clearTimeout(longPressTimers.current[docId]);
  }, []);

  /* ---- CLICK SUR IMAGE ---- */
  const handlePhotoClick = useCallback((photo) => {
    if (selectionMode) {
      // En mode sélection : cocher/décocher
      setSelectedPhotos(prev => {
        const next = new Set(prev);
        if (next.has(photo._docId)) {
          next.delete(photo._docId);
          if (next.size === 0) setSelectionMode(false); // quitter si tout décoché
        } else {
          next.add(photo._docId);
        }
        return next;
      });
    } else {
      // Sinon : ouvrir en plein écran
      setLightboxPhoto(photo);
    }
  }, [selectionMode]);

  /* ---- TÉLÉCHARGEMENT INDIVIDUEL (JPG direct, sans ZIP) ---- */
  const downloadSingle = useCallback((photo, e) => {
    e.stopPropagation();
    const base64Data = photo.url.split(',')[1];
    if (!base64Data) return;
    const byteChars = atob(base64Data);
    const byteArray = new Uint8Array([...byteChars].map(c => c.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: "image/jpeg" });
    saveAs(blob, `Souvenir_Mariage.jpg`);
  }, []);

  /* ---- TÉLÉCHARGEMENT TOUT EN ZIP ---- */
  const downloadAllAsZip = async () => {
    if (photos.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      let count = 1;
      for (const photo of photos) {
        const base64Data = photo.url.split(',')[1];
        if (base64Data) { zip.file(`Souvenir_${count}.jpg`, base64Data, { base64: true }); count++; }
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Tous_Souvenirs_Madelle_Hugues.zip");
    } catch (e) {
      alert("Erreur lors de l'archivage.");
    } finally {
      setIsDownloading(false);
    }
  };

  /* ---- SUPPRIMER ---- */
  const handleDelete = async (docId) => {
    if (confirm("Supprimer cette photo ?")) await deleteDoc(doc(db, "photos", docId));
  };

  const toggleModeration = () => {
    if (isModerator) return setIsModerator(false);
    if (prompt("Code d'accès modérateur :") === "maries2026") setIsModerator(true);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedPhotos(new Set());
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

      {/* ===== LIGHTBOX ===== */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          {/* Bouton fermer */}
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white z-10 transition-colors"
            onClick={() => setLightboxPhoto(null)}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Bouton télécharger dans la lightbox */}
          <button
            className="absolute top-6 left-6 text-white/60 hover:text-white z-10 transition-colors"
            onClick={(e) => downloadSingle(lightboxPhoto, e)}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>

          <img
            src={lightboxPhoto.url}
            alt="Souvenir"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ===== EN-TÊTE GALERIE ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-white/10">
        <div className="flex flex-col items-start mb-6 sm:mb-0">
          <h2 className="text-3xl font-space font-bold tracking-tight text-white uppercase tracking-widest">Galerie</h2>
          <span className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">
            {selectionMode ? `${selectedPhotos.size} sélectionnée(s)` : `${photos.length} photos`}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {selectionMode ? (
            /* Barre de sélection */
            <div className="flex items-center gap-3 animate-fade-in">
              <button
                onClick={exitSelectionMode}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest"
              >
                Annuler
              </button>
            </div>
          ) : (
            photos.length > 0 && (
              <button
                onClick={downloadAllAsZip}
                disabled={isDownloading}
                className="bg-white text-black hover:bg-gray-200 text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest flex items-center gap-2"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Zip en cours...
                  </span>
                ) : (
                  <>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Tout télécharger (ZIP)
                  </>
                )}
              </button>
            )
          )}

          <button
            onClick={toggleModeration}
            className={`text-xs font-bold transition-colors px-4 py-2 border rounded-full uppercase tracking-widest ${
              isModerator ? "bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30" : "text-gray-400 border-transparent hover:text-white"
            }`}
          >
            {isModerator ? "Fermer Modération" : "Admin"}
          </button>
        </div>
      </div>

      {/* Aide sélection */}
      {!selectionMode && photos.length > 0 && (
        <p className="text-xs text-gray-600 text-center mb-6 uppercase tracking-widest">
          Appui long pour sélectionner · Clic pour agrandir
        </p>
      )}

      {/* ===== GRILLE PHOTOS ===== */}
      {photos.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in relative border border-white/10">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">
            La galerie est vide.<br/>
            <span className="text-white mt-2 block">Soyez le premier à ajouter une photo.</span>
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo, i) => {
            const isSelected = selectedPhotos.has(photo._docId);
            return (
              <div
                key={photo._docId}
                className={`relative group break-inside-avoid animate-fade-up overflow-hidden rounded-2xl bg-white/5 shadow-lg transition-all duration-200 cursor-pointer select-none
                  ${isSelected ? "border-[3px] border-white scale-[0.97]" : "border border-white/10"}
                `}
                style={{ animationDelay: `${Math.min(i * 0.03, 0.8)}s` }}
                onClick={() => handlePhotoClick(photo)}
                onMouseDown={() => handlePressStart(photo._docId)}
                onMouseUp={() => handlePressEnd(photo._docId)}
                onMouseLeave={() => handlePressEnd(photo._docId)}
                onTouchStart={() => handlePressStart(photo._docId)}
                onTouchEnd={() => handlePressEnd(photo._docId)}
              >
                {/* Indicateur de sélection (case à cocher) */}
                {selectionMode && (
                  <div className={`absolute top-3 right-3 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-lg
                    ${isSelected ? "bg-white border-white" : "border-white/60 bg-black/40"}`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Image */}
                <img
                  src={photo.url}
                  alt="Souvenir"
                  className={`w-full transition-transform duration-500 ease-out
                    ${!selectionMode && "group-hover:scale-[1.03]"}
                    ${isSelected && "opacity-70 scale-[0.97]"}
                  `}
                  loading="lazy"
                  draggable={false}
                />

                {/* Overlay au survol (mode normal seulement) */}
                {!selectionMode && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
                    <div className="flex justify-between items-center w-full transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">

                      {/* Bouton téléchargement individuel (JPG direct) */}
                      <button
                        onClick={(e) => downloadSingle(photo, e)}
                        className="bg-white/90 hover:bg-white text-black w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                        title="Télécharger en JPG"
                      >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>

                      {/* Bouton supprimer (modérateur) */}
                      {isModerator && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(photo._docId); }}
                          className="bg-red-500/80 hover:bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                          title="Supprimer"
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
