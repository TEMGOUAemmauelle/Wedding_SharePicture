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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const longPressTimers = useRef({});

  useEffect(() => {
    let unsubscribe = () => {};
    const setupListener = async () => {
      try {
        if (!auth.currentUser) await loginAnonymously();
        const q = query(collection(db, "photos"), where("eventId", "==", eventId), orderBy("createdAt", "desc"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          setPhotos(snapshot.docs.map((d) => ({ _docId: d.id, ...d.data() })));
          setLoading(false);
        });
      } catch (err) { console.error(err); setLoading(false); }
    };
    setupListener();
    return () => unsubscribe();
  }, [eventId]);

  // Fermer lightbox avec Echap + bloquer le scroll du body
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setLightboxPhoto(null); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (lightboxPhoto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxPhoto]);

  /* LONG PRESS */
  const handlePressStart = useCallback((docId) => {
    longPressTimers.current[docId] = setTimeout(() => {
      setSelectionMode(true);
      setSelectedPhotos(prev => new Set([...prev, docId]));
    }, 500);
  }, []);

  const handlePressEnd = useCallback((docId) => {
    clearTimeout(longPressTimers.current[docId]);
  }, []);

  /* CLICK SUR IMAGE */
  const handlePhotoClick = useCallback((photo) => {
    if (selectionMode) {
      setSelectedPhotos(prev => {
        const next = new Set(prev);
        if (next.has(photo._docId)) {
          next.delete(photo._docId);
          if (next.size === 0) setSelectionMode(false);
        } else {
          next.add(photo._docId);
        }
        return next;
      });
    } else {
      setLightboxPhoto(photo);
    }
  }, [selectionMode]);

  /* TÉLÉCHARGEMENT INDIVIDUEL JPG */
  const downloadSingle = useCallback((photo, e) => {
    e?.stopPropagation();
    const base64Data = photo.url.split(',')[1];
    if (!base64Data) return;
    const byteChars = atob(base64Data);
    const byteArray = new Uint8Array([...byteChars].map(c => c.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: "image/jpeg" });
    saveAs(blob, `Souvenir_Mariage.jpg`);
  }, []);

  /* ZIP TOUT */
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
      saveAs(content, "Tous_Souvenirs.zip");
    } catch (e) { alert("Erreur lors de l'archivage."); }
    finally { setIsDownloading(false); }
  };

  /* SUPPRIMER */
  const handleDelete = async (docId) => {
    if (confirm("Supprimer cette photo ?")) await deleteDoc(doc(db, "photos", docId));
  };

  const toggleModeration = () => {
    if (isModerator) return setIsModerator(false);
    if (prompt("Code d'accès modérateur :") === "maries2026") setIsModerator(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"/>
      </div>
    );
  }

  return (
    <div className="w-full font-outfit relative">

      {/* ══════════ LIGHTBOX ══════════ */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-black/97 animate-fade-in"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Barre d'outils fixée en haut */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-black/80 border-b border-white/10">
            {/* Télécharger */}
            <button
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
              onClick={(e) => downloadSingle(lightboxPhoto, e)}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="hidden sm:inline">Télécharger</span>
            </button>

            {/* Fermer */}
            <button
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
              onClick={() => setLightboxPhoto(null)}
            >
              <span className="hidden sm:inline">Fermer</span>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Zone image, centrée, clique pour fermer */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden p-4"
            onClick={() => setLightboxPhoto(null)}
          >
            <img
              src={lightboxPhoto.url}
              alt="Souvenir"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 80px)' }}
            />
          </div>
        </div>
      )}

      {/* ══════════ EN-TÊTE ══════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-white/10 gap-4">
        <div>
          <h2 className="text-3xl font-space font-bold text-white uppercase tracking-widest">Galerie</h2>
          <span className="text-sm text-gray-400 mt-1 uppercase tracking-widest block">
            {selectionMode ? `${selectedPhotos.size} sélectionnée(s)` : `${photos.length} photos`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectionMode ? (
            <button
              onClick={() => { setSelectionMode(false); setSelectedPhotos(new Set()); }}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest"
            >
              Annuler
            </button>
          ) : (
            photos.length > 0 && (
              <button
                onClick={downloadAllAsZip}
                disabled={isDownloading}
                className="bg-white text-black hover:bg-gray-200 text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Zip en cours...
                  </span>
                ) : <>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Tout (ZIP)
                </>}
              </button>
            )
          )}
          <button
            onClick={toggleModeration}
            className={`text-xs font-bold px-4 py-2 border rounded-full uppercase tracking-widest transition-colors ${isModerator ? "bg-red-500/20 text-red-500 border-red-500/30" : "text-gray-500 border-transparent hover:text-white"}`}
          >
            {isModerator ? "Fermer" : "Admin"}
          </button>
        </div>
      </div>

      {/* Aide */}
      {!selectionMode && photos.length > 0 && (
        <p className="text-[11px] text-gray-600 text-center mb-6 uppercase tracking-widest">
          Appui long pour sélectionner · Tap pour agrandir
        </p>
      )}

      {/* ══════════ GRILLE ══════════ */}
      {photos.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in border border-white/10">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">
            La galerie est vide.<br/>
            <span className="text-white mt-2 block">Soyez le premier à ajouter une photo.</span>
          </p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {photos.map((photo, i) => {
            const isSelected = selectedPhotos.has(photo._docId);
            return (
              <div
                key={photo._docId}
                className={`relative group break-inside-avoid overflow-hidden rounded-xl bg-white/5 shadow-lg transition-all duration-200 cursor-pointer select-none animate-fade-up
                  ${isSelected ? "border-[2px] border-white scale-[0.97]" : "border border-white/10"}
                `}
                style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s` }}
                onClick={() => handlePhotoClick(photo)}
                onMouseDown={() => handlePressStart(photo._docId)}
                onMouseUp={() => handlePressEnd(photo._docId)}
                onMouseLeave={() => handlePressEnd(photo._docId)}
                onTouchStart={() => handlePressStart(photo._docId)}
                onTouchEnd={() => handlePressEnd(photo._docId)}
              >
                {/* Case à cocher sélection */}
                {selectionMode && (
                  <div className={`absolute top-2 right-2 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-lg
                    ${isSelected ? "bg-white border-white" : "border-white/60 bg-black/40"}`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}

                <img
                  src={photo.url}
                  alt="Souvenir"
                  className={`w-full transition-transform duration-500 ${!selectionMode && "group-hover:scale-[1.03]"} ${isSelected && "opacity-70"}`}
                  loading="lazy"
                  draggable={false}
                />

                {/* Bouton téléchargement — toujours visible en bas à droite */}
                {!selectionMode && (
                  <div className="absolute bottom-2 right-2 z-20">
                    <button
                      onClick={(e) => downloadSingle(photo, e)}
                      className="w-8 h-8 bg-black/60 hover:bg-black/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border border-white/20"
                      title="Télécharger en JPG"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Bouton supprimer admin */}
                {!selectionMode && isModerator && (
                  <div className="absolute bottom-2 left-2 z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo._docId); }}
                      className="w-8 h-8 bg-red-500/70 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
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
