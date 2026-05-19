"use client";

import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, loginAnonymously } from "../lib/firebase";

export default function Upload({ eventId }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 1200;
          if (width > height && width > maxDim) { height *= maxDim / width; width = maxDim; }
          else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
          
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          
          if (dataUrl.length > 1000000) {
            alert(`L'image "${file.name}" est trop lourde même après compression. Réessayez avec une image moins détaillée.`);
            resolve(null);
          } else resolve(dataUrl);
        };
        img.onerror = reject; img.src = e.target.result;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files) => {
    if (!files.length) return;
    if (files.length > 10) return alert("Maximum 10 photos à la fois.");
    setUploading(true);
    let newProgress = {};

    try {
      if (!auth.currentUser) await loginAnonymously();
      for (let file of files) {
        newProgress[file.name] = 30; setProgress({ ...newProgress });
        const base64Url = await processImageToBase64(file);
        if (base64Url) {
          newProgress[file.name] = 70; setProgress({ ...newProgress });
          const fileId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          await addDoc(collection(db, "photos"), { id: fileId, eventId, url: base64Url, createdAt: serverTimestamp(), downloaded: 0 });
        }
        newProgress[file.name] = 100; setProgress({ ...newProgress });
      }
    } catch (error) {
      console.error(error); alert("Erreur lors de l'envoi.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false);
      setTimeout(() => setProgress({}), 3000);
    }
  };

  const handleFileChange = (e) => processFiles(Array.from(e.target.files));

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    processFiles(files);
  };

  return (
    <div
      className={`w-full max-w-xl mx-auto glass-panel p-10 sm:p-14 text-center rounded-[2rem] font-outfit relative overflow-hidden transition-all duration-500
        ${dragOver ? "border-white/40 scale-[1.01] shadow-[0_0_60px_rgba(255,255,255,0.08)]" : "border border-white/10"}
      `}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >

      {/* Reflet interne animé */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none transition-opacity duration-500 ${dragOver ? "opacity-100" : "opacity-0"}`}/>

      {/* Icône upload animée */}
      <div className={`w-20 h-20 border border-white/15 rounded-full flex items-center justify-center mx-auto mb-8 bg-white/[0.04] transition-all duration-500 ${dragOver ? "scale-110 border-white/40 bg-white/10" : ""} ${uploading ? "animate-pulse-slow" : "hover:scale-105"}`}>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8 transition-all duration-500 ${dragOver ? "text-white" : "text-gray-400"}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <h3 className="text-2xl font-bold font-space text-white mb-2 tracking-tight">
        {dragOver ? "Déposez ici !" : "Ajouter des photos"}
      </h3>
      <p className="text-gray-500 text-sm mb-10">
        {dragOver ? "Relâchez pour envoyer vos photos" : "Glissez-déposez ou sélectionnez · Max 10 photos"}
      </p>
      
      {/* Bouton principal */}
      <label className={`cursor-pointer inline-flex items-center justify-center rounded-full py-4 px-10 font-bold text-base tracking-wide transition-all duration-300 select-none
        ${uploading
          ? "bg-white/10 border border-white/10 text-gray-500 cursor-wait"
          : "bg-white text-black hover:bg-gray-100 active:scale-95 shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:shadow-[0_4px_32px_rgba(255,255,255,0.2)]"}
      `}>
        {uploading ? (
          <span className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Traitement en cours...
          </span>
        ) : "Choisir des photos"}
        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={uploading}/>
      </label>

      {/* Barres de progression */}
      {Object.keys(progress).length > 0 && (
        <div className="mt-10 space-y-4 text-left animate-fade-in">
          {Object.entries(progress).map(([name, val]) => (
            <div key={name} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span className="truncate max-w-[200px]">{name}</span>
                <span className={`font-bold transition-colors ${val === 100 ? "text-white" : "text-gray-300"}`}>{Math.round(val)}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${val}%`,
                    background: val === 100
                      ? "linear-gradient(90deg, #BF953F, #FCF6BA)"
                      : "rgba(255,255,255,0.8)"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
