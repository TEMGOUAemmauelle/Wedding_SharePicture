"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db, auth, loginAnonymously } from "../lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Gallery({ eventId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  
  // États de sélection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

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

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPhotos(new Set());
  };

  const togglePhotoSelection = (docId) => {
    if (!selectionMode) return;
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedPhotos(newSelection);
  };

  const downloadSelectedAsZip = async () => {
    if (selectedPhotos.size === 0) return alert("Veuillez sélectionner des photos.");
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      let count = 1;
      const photosToDownload = photos.filter(p => selectedPhotos.has(p._docId));
      
      for (const photo of photosToDownload) {
        const base64Data = photo.url.split(',')[1];
        if (base64Data) {
          zip.file(`Souvenir_${count}.webp`, base64Data, { base64: true });
          count++;
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Sélection_Mariage.zip");
    } catch (e) {
      alert("Erreur lors de l'archivage.");
    } finally {
      setIsDownloading(false);
      setSelectionMode(false);
      setSelectedPhotos(new Set());
    }
  };

  const downloadAllAsZip = async () => {
    if (photos.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      let count = 1;
      for (const photo of photos) {
        const base64Data = photo.url.split(',')[1];
        if (base64Data) {
          zip.file(`Souvenir_${count}.webp`, base64Data, { base64: true });
          count++;
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Tous_Souvenirs.zip");
    } catch (e) {
      alert("Erreur lors de l'archivage.");
    } finally {
      setIsDownloading(false);
    }
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
          <h2 className="text-3xl font-space font-bold tracking-tight text-white uppercase tracking-widest">Galerie</h2>
          <span className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">
            {photos.length} photos
          </span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          {photos.length > 0 && !selectionMode && (
             <button
              onClick={toggleSelectionMode}
              disabled={isDownloading}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest"
             >
              Sélect. Multiple
             </button>
          )}

          {selectionMode ? (
            <div className="flex items-center space-x-2 animate-fade-in">
              <button
                onClick={downloadSelectedAsZip}
                disabled={isDownloading || selectedPhotos.size === 0}
                className={`text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest ${selectedPhotos.size > 0 ? "bg-white text-black hover:bg-gray-200" : "bg-white/20 text-gray-400"}`}
              >
                {isDownloading ? "Archive (Patienter...)" : `Télécharger (${selectedPhotos.size})`}
              </button>
              <button
                onClick={toggleSelectionMode}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest"
              >
                Annuler
              </button>
            </div>
          ) : (
            photos.length > 0 && (
              <button
                onClick={downloadAllAsZip}
                disabled={isDownloading}
                className="bg-white text-black hover:bg-gray-200 text-xs font-bold py-2 px-4 rounded-full transition-all uppercase tracking-widest flex items-center"
              >
                {isDownloading ? (
                   <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Téléchargement...
                   </span>
                ) : "Tout télécharger"}
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

      {photos.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in relative border border-white/10">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">La galerie est vide.<br/><span className="text-white mt-2 block">Soyez le premier à ajouter une photo.</span></p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {photos.map((photo, i) => {
            const isSelected = selectedPhotos.has(photo._docId);
            return (
              <div 
                key={photo._docId} 
                onClick={() => togglePhotoSelection(photo._docId)}
                className={`relative group break-inside-avoid animate-fade-up overflow-hidden rounded-2xl bg-white/5 shadow-lg transition-all 
                  ${selectionMode ? 'cursor-pointer' : ''} 
                  ${isSelected ? 'border-[3px] border-white scale-[0.98]' : 'border border-white/10'}
                `}
                style={{ animationDelay: `${Math.min(i * 0.05, 1)}s` }}
              >
                
                {selectionMode && (
                  <div className={`absolute top-4 right-4 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors 
                    ${isSelected ? 'bg-white border-white text-black' : 'border-white/50 bg-black/30 text-transparent group-hover:border-white'}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <img
                  src={photo.url}
                  alt="Souvenir"
                  className={`w-full transform transition-transform duration-700 ease-out 
                    ${!selectionMode && 'group-hover:scale-[1.03]'}
                    ${isSelected && 'opacity-60'}
                  `}
                  loading="lazy"
                />
                
                {!selectionMode && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 z-20">
                    <div className="flex justify-between items-center w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center shadow-lg"
                      >
                         Agrandir
                      </a>
                      
                      {isModerator && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(photo._docId); }}
                          className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
                          title="Supprimer"
                        >
                          Détruire
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
