"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db, auth, loginAnonymously } from "../lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Gallery({ eventId }) {
  const [photos, setPhotos]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [isModerator, setIsModerator]       = useState(false);
  const [selectionMode, setSelectionMode]   = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [isDownloading, setIsDownloading]   = useState(false);
  const [lightboxPhoto, setLightboxPhoto]   = useState(null);
  const [mounted, setMounted]               = useState(false);
  const longPressTimers                     = useRef({});

  // Pour le portal (SSR-safe)
  useEffect(() => { setMounted(true); }, []);

  /* ── Firebase listener ── */
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        if (!auth.currentUser) await loginAnonymously();
        unsub = onSnapshot(
          query(collection(db, "photos"), where("eventId", "==", eventId), orderBy("createdAt", "desc")),
          snap => { setPhotos(snap.docs.map(d => ({ _docId: d.id, ...d.data() }))); setLoading(false); }
        );
      } catch (e) { console.error(e); setLoading(false); }
    })();
    return () => unsub();
  }, [eventId]);

  /* ── Echap ferme le lightbox ── */
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") setLightboxPhoto(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ── Bloquer le scroll du body quand lightbox ouverte ── */
  useEffect(() => {
    document.body.style.overflow = lightboxPhoto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxPhoto]);

  /* ── Long press ── */
  const onPressStart = useCallback((id) => {
    longPressTimers.current[id] = setTimeout(() => {
      setSelectionMode(true);
      setSelectedPhotos(prev => new Set([...prev, id]));
    }, 600);
  }, []);

  const onPressEnd = useCallback((id) => {
    clearTimeout(longPressTimers.current[id]);
  }, []);

  // Annuler si l'utilisateur scrolle
  const onPressMove = useCallback((id) => {
    clearTimeout(longPressTimers.current[id]);
  }, []);

  /* ── Tap ── */
  const onPhotoTap = useCallback((photo) => {
    if (selectionMode) {
      setSelectedPhotos(prev => {
        const next = new Set(prev);
        next.has(photo._docId) ? next.delete(photo._docId) : next.add(photo._docId);
        if (next.size === 0) setSelectionMode(false);
        return next;
      });
    } else {
      setLightboxPhoto(photo);
    }
  }, [selectionMode]);

  /* ── Télécharger 1 photo JPG ── */
  const dlSingle = useCallback((photo, e) => {
    e?.stopPropagation();
    const b64 = photo.url.split(",")[1];
    if (!b64) return;
    const bytes = atob(b64);
    const arr = new Uint8Array([...bytes].map(c => c.charCodeAt(0)));
    saveAs(new Blob([arr], { type: "image/jpeg" }), "Souvenir_Mariage.jpg");
  }, []);

  /* ── ZIP sélection ── */
  const dlSelection = async () => {
    if (!selectedPhotos.size) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      photos.filter(p => selectedPhotos.has(p._docId)).forEach((p, i) => {
        const b64 = p.url.split(",")[1];
        if (b64) zip.file(`Souvenir_${i + 1}.jpg`, b64, { base64: true });
      });
      saveAs(await zip.generateAsync({ type: "blob" }), `Selection_${selectedPhotos.size}_photos.zip`);
    } catch (e) { alert("Erreur archivage."); }
    finally {
      setIsDownloading(false);
      setSelectionMode(false);
      setSelectedPhotos(new Set());
    }
  };

  /* ── ZIP tout ── */
  const dlAll = async () => {
    if (!photos.length) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      photos.forEach((p, i) => { const b64 = p.url.split(",")[1]; if (b64) zip.file(`Souvenir_${i + 1}.jpg`, b64, { base64: true }); });
      saveAs(await zip.generateAsync({ type: "blob" }), "Tous_Souvenirs.zip");
    } catch (e) { alert("Erreur archivage."); }
    finally { setIsDownloading(false); }
  };

  /* ── Supprimer ── */
  const handleDelete = async (id) => {
    if (confirm("Supprimer cette photo ?")) await deleteDoc(doc(db, "photos", id));
  };

  const toggleMod = () => {
    if (isModerator) return setIsModerator(false);
    if (prompt("Code modérateur :") === "maries2026") setIsModerator(true);
  };

  /* ══════════════════════════════════════════
     LIGHTBOX — rendu via Portal dans document.body
     Contourne tout CSS transform des ancêtres
  ══════════════════════════════════════════ */
  const lightboxEl = lightboxPhoto ? (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        background: "rgba(0,0,0,0.97)",
      }}
    >
      {/* ── Barre fixe en haut ── */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: "56px",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(0,0,0,1)",
      }}>
        <button
          onClick={(e) => dlSingle(lightboxPhoto, e)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: "none", border: "none", cursor: "pointer",
            outline: "none", padding: "12px 4px",
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
          </svg>
          Télécharger
        </button>

        <button
          onClick={() => setLightboxPhoto(null)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            background: "none", border: "none", cursor: "pointer",
            outline: "none", padding: "12px 4px",
          }}
        >
          Fermer
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* ── Zone image scrollable, centrée ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px 48px",
        }}
        onClick={() => setLightboxPhoto(null)}
      >
        <img
          src={lightboxPhoto.url}
          alt="Souvenir"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            cursor: "default",
            display: "block",
          }}
        />
      </div>
    </div>
  ) : null;

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"/>
    </div>
  );

  return (
    <div className="w-full font-outfit relative">

      {/* Portal : injecté directement dans <body>, hors de tout transform */}
      {mounted && lightboxEl && createPortal(lightboxEl, document.body)}

      {/* ── En-tête galerie ── */}
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-white/10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-space font-bold text-white uppercase tracking-widest leading-none">Galerie</h2>
          <span className="text-xs text-gray-500 mt-1 uppercase tracking-widest block">
            {selectionMode
              ? `${selectedPhotos.size} sélectionnée${selectedPhotos.size > 1 ? "s" : ""}`
              : `${photos.length} photo${photos.length > 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectionMode ? (
            <>
              <button
                onClick={dlSelection}
                disabled={isDownloading || selectedPhotos.size === 0}
                title={`Télécharger ${selectedPhotos.size} photo(s) (ZIP)`}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
                  selectedPhotos.size > 0
                    ? "bg-white border-white text-black hover:bg-gray-200 shadow-lg"
                    : "bg-white/10 border-white/10 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isDownloading
                  ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                }
              </button>
              <button
                onClick={() => { setSelectionMode(false); setSelectedPhotos(new Set()); }}
                title="Annuler la sélection"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-all"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </>
          ) : (
            photos.length > 0 && (
              <button
                onClick={dlAll}
                disabled={isDownloading}
                title="Tout télécharger (ZIP)"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/15 text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-40"
              >
                {isDownloading
                  ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                }
              </button>
            )
          )}

          <button
            onClick={toggleMod}
            title={isModerator ? "Fermer la modération" : "Accès modérateur"}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
              isModerator ? "bg-red-500/20 border-red-500/40 text-red-400" : "border-transparent text-gray-700 hover:text-gray-400 hover:border-white/10"
            }`}
          >
            {isModerator
              ? <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
              : <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Astuce */}
      {!selectionMode && photos.length > 0 && (
        <p className="text-[11px] text-gray-600 text-center mb-6 uppercase tracking-widest">
          Appui long pour sélectionner · Tap pour agrandir
        </p>
      )}

      {/* ── Grille ── */}
      {photos.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in border border-white/10">
          <p className="text-gray-400 text-sm uppercase tracking-widest">
            La galerie est vide.<br/><span className="text-white mt-2 block">Soyez le premier à ajouter une photo.</span>
          </p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {photos.map((photo, i) => {
            const isSel = selectedPhotos.has(photo._docId);
            return (
              <div
                key={photo._docId}
                className={`relative group break-inside-avoid overflow-hidden rounded-xl bg-white/5 shadow-lg cursor-pointer select-none animate-fade-up transition-all duration-200 ${
                  isSel ? "ring-2 ring-white scale-[0.97]" : "ring-1 ring-white/10"
                }`}
                style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s`, touchAction: "manipulation" }}
                onClick={() => onPhotoTap(photo)}
                onMouseDown={() => onPressStart(photo._docId)}
                onMouseUp={() => onPressEnd(photo._docId)}
                onMouseLeave={() => onPressEnd(photo._docId)}
                onTouchStart={() => onPressStart(photo._docId)}
                onTouchMove={() => onPressMove(photo._docId)}
                onTouchEnd={() => onPressEnd(photo._docId)}
              >
                {selectionMode && (
                  <div className={`absolute top-2 left-2 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${
                    isSel ? "bg-white border-white" : "border-white/60 bg-black/50"
                  }`}>
                    {isSel && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </div>
                )}

                <img
                  src={photo.url}
                  alt="Souvenir"
                  className={`w-full transition-transform duration-500 ${!selectionMode && "group-hover:scale-[1.04]"} ${isSel && "opacity-70"}`}
                  loading="lazy"
                  draggable={false}
                />

                {!selectionMode && (
                  <button
                    onClick={(e) => dlSingle(photo, e)}
                    className="absolute bottom-2 right-2 z-20 w-8 h-8 bg-black/60 hover:bg-black/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border border-white/20"
                    title="Télécharger"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                    </svg>
                  </button>
                )}

                {!selectionMode && isModerator && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo._docId); }}
                    className="absolute bottom-2 left-2 z-20 w-8 h-8 bg-red-500/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
