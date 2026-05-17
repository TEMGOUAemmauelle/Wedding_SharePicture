# Weddind ✨

Une galerie de mariage numérique haut de gamme, conçue pour immortaliser vos moments d'exception. Dotée d'une charte graphique luxueuse (Noir profond, Blanc pur et accents Or), l'application permet aux invités de partager leurs clichés en temps réel de manière totalement fluide, épurée et sans friction.

## 🌟 Fonctionnalités Principales

- **Design Haute Couture** : Interface minimaliste, effets de *Glassmorphism*, et polices ultra-modernes (*Space Grotesk* et *Outfit*).
- **Upload Intelligent "Zéro Coût"** : L'application by-pass entièrement le besoin d'un stockage payant (comme AWS S3 ou Firebase Storage) ! Les images sont compressées côté navigateur (Canvas HTML5), converties en `.webp` ultra-léger et injectées directement sous forme de texte (Base64) dans la base de données Firestore.
- **Galerie en Temps Réel** : Les invités voient le mur de photos s'actualiser en direct, au fil de la soirée, avec un sublime rendu dynamique "Masonry" sur plusieurs colonnes.
- **Accès Sans Inscription** : Authentification totalement invisible et instantanée pour tous les invités via "Firebase Anonymous Auth".
- **Administration & Modération** : Interface d'administration pour la génération de QR codes uniques, et outil de modération intégré pour retirer un cliché en direct (Secret: `maries2026`).

## 🛠️ Pile Technologique (Tech Stack)

- **Framework :** [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Style :** [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend (BaaS) :** [Firebase](https://firebase.google.com/) (Firestore NoSQL, Auth Anonyme)
- **Génération QR Code :** Librairie `qrcode`

## 🚀 Installation & Lancement Rapide

### 1️⃣ Pré-requis
- Node.js (v18 ou ultérieur) installé sur votre machine.
- Un projet totalement gratuit configuré sur [Firebase Console](https://console.firebase.google.com/).

### 2️⃣ Installation
Suivez ces étapes dans votre terminal :

```bash
# 1. Installer les dépendances JavaScript
npm install
```

### 3️⃣ Configuration Firebase (Le coffre-fort)
Copiez ou ouvrez le fichier `.env.local` présent à la racine, et connectez-le à votre tableau de bord Firebase (Project Settings > App config).

```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...votre-cle-api-secrete"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="votresite.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="votresite-f123"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567:web:abcde"
```

Ouvrez ensuite l'onglet **Firestore Database > Rules** sur Firebase, et appliquez les règles suivantes :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{document} {
      allow read, create, delete: if request.auth != null;
    }
  }
}
```

*Note Indexation : Firestore peut générer une erreur la première fois pour vous dire qu'il a besoin d'un Index Composite (car on filtre ET on fait un tri par date). En cas d'erreur dans la console, cliquez simplement sur le lien Firebase fourni pour construire l'index en 2 minutes.*

### 4️⃣ Lancement Local
```bash
npm run dev
```
Rendez-vous sur [http://localhost:3000](http://localhost:3000) et admirez l'expérience.

## 🤝 Hébergement (Déploiement en ligne)

L'application est totalement "Prête à l'emploi" pour être déployée gratuitement sur **Vercel** (`vercel.com`). Pensez simplement à copier les 6 variables de votre fichier `.env.local`  dans l'onglet *Environment Variables* des paramètres de votre projet Vercel !
