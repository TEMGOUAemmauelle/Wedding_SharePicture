"use client";

import { useState } from "react";
import QRCode from "qrcode";

export default function CreateEvent() {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [eventId, setEventId] = useState("abc123");
  const [baseUrl, setBaseUrl] = useState("https://votre-domaine.vercel.app/w/");

  const generateQRCode = async () => {
    try {
      const fullUrl = `${baseUrl}${eventId}`;
      // Generate QR Code as Data URI
      const url = await QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Erreur de génération QR Code", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un QR Code
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Générer le QR code de scan pour les invités
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="eventId" className="block text-sm font-medium text-gray-700">Code de l'événement (ID)</label>
              <input
                id="eventId"
                name="eventId"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: abc123"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">URL de base du site</label>
              <input
                id="baseUrl"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              onClick={generateQRCode}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Générer le QR Code
            </button>
          </div>
        </div>

        {qrCodeUrl && (
          <div className="mt-8 flex flex-col items-center space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900">QR Code Résultat :</h3>
            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border rounded-md shadow-sm" />
            <a
              href={qrCodeUrl}
              download={`qr-code-${eventId}.png`}
              className="text-blue-600 hover:text-blue-500 font-medium text-sm"
            >
              Télécharger l'image QR Code
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
