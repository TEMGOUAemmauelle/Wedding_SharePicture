"use client";

import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, loginAnonymously } from "../lib/firebase";

export default function Upload({ eventId }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const fileInputRef = useRef(null);

  // Compression et conversion en Base64 pour stocker directement dans Firestore
  const processImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          // On réduit fortement à 1200px max pour garantir que le fichier Base64 
          // pèsera moins de 1 Mo (limite stricte d'un document Firestore)
          const maxDim = 1200;
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Qualité 0.7 pour optimiser au maximum le poids de la chaîne Base64
          const dataUrl = canvas.toDataURL("image/webp", 0.7);
          
          // Un doc Firestore fait max 1 048 576 bytes. 
          // On avertit si l'image encodée est malgré tout trop grosse.
          if (dataUrl.length > 1000000) {
            alert(`L'image ${file.name} est trop détaillée et dépasse le quota de la base de données après compression.`);
            resolve(null);
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length > 10) return alert("Seulement 10 photographies à la fois.");
    
    setUploading(true);
    let newProgress = { ...progress };

    try {
      if (!auth.currentUser) await loginAnonymously();
      
      for (let file of files) {
        newProgress[file.name] = 30; // Compression...
        setProgress({ ...newProgress });
        
        const base64Url = await processImageToBase64(file);
        
        if (base64Url) {
          newProgress[file.name] = 70; // Envoi à Firestore...
          setProgress({ ...newProgress });
          
          const fileId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // On injecte purement la chaîne Base64 dans Firestore au lieu du Storage direct !
          await addDoc(collection(db, "photos"), { 
            id: fileId, 
            eventId, 
            url: base64Url, 
            createdAt: serverTimestamp(), 
            downloaded: 0 
          });
        }
        
        newProgress[file.name] = 100;
        setProgress({ ...newProgress });
      }
    } catch (error) {
      console.error(error); alert("Erreur d'upload.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false); setTimeout(() => setProgress({}), 4000);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto glass-panel border border-white/10 p-10 sm:p-14 text-center transform transition-all duration-700 font-outfit rounded-[2rem]">
      
      <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-8 text-white relative bg-white/5">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <h3 className="text-2xl font-bold font-space uppercase tracking-widest text-white mb-2">Déposer une œuvre</h3>
      <p className="text-gray-500 text-[10px] tracking-widest uppercase mb-10">Limitée à 10 par sélection</p>
      
      <div className="flex flex-col items-center justify-center">
        <label className={`
          cursor-pointer inline-flex items-center justify-center rounded-full
          py-4 px-10 border font-medium text-black shadow-xl text-xs uppercase tracking-widest transition-all duration-500
          ${uploading ? 'bg-[#111] border-white/20 text-gray-500 cursor-wait' : 'bg-white border-transparent hover:bg-gray-200 active:scale-95'}
        `}>
          {uploading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Traitement en cours...
            </span>
          ) : (
             <span className="flex items-center text-black font-bold">Sélecteur de fichiers</span>
          )}
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={uploading}/>
        </label>
      </div>

      {Object.keys(progress).length > 0 && (
        <div className="mt-10 space-y-3 text-left animate-fade-in font-outfit">
          {Object.entries(progress).map(([name, val]) => (
            <div key={name} className="flex flex-col">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider mb-1 text-gray-400">
                <span className="truncate w-40 sm:w-60">{name}</span>
                <span className="text-white font-bold">{Math.round(val)}%</span>
              </div>
              <div className="w-full bg-white/10 h-[2px] rounded-full overflow-hidden">
                <div className="bg-white h-[2px] transition-all duration-300 ease-out" style={{ width: `${val}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
