# Guide de démarrage rapide - NEWBIZ

## 🚀 Installation rapide

### 1. Configuration Supabase (5 minutes)

1. Créez un compte sur [https://supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **SQL Editor** → **New Query**
4. Copiez-collez le contenu de `supabase/schema.sql` et exécutez-le
5. Allez dans **Settings** → **API** et copiez :
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

### 2. Installation Backend

```bash
cd backend
npm install
```

Créez un fichier `.env` :
```bash
cp env.example .env
```

Éditez `.env` et ajoutez vos clés Supabase :
```
PORT=5000
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon
SIRENE_API_KEY=optionnel
```

### 3. Installation Frontend

```bash
cd frontend
npm install
```

Créez un fichier `.env` :
```bash
cp env.example .env
```

Le fichier `.env` devrait contenir :
```
VITE_API_URL=http://localhost:5000
```

### 4. Démarrer l'application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Ouvrez votre navigateur sur **http://localhost:3000**

## ✅ Vérification

1. Le backend devrait afficher : `🚀 Serveur backend démarré sur le port 5000`
2. Le frontend devrait s'ouvrir automatiquement
3. Testez une recherche avec :
   - Secteur : `boulangerie`
   - Département : `75`

## 🔧 Dépannage

### Erreur "Supabase non configuré"
- Vérifiez que vos variables d'environnement sont correctes dans `backend/.env`
- Redémarrez le serveur backend

### Erreur de connexion API
- Vérifiez que le backend tourne sur le port 5000
- Vérifiez `VITE_API_URL` dans `frontend/.env`

### Erreur de base de données
- Vérifiez que vous avez exécuté le script SQL dans Supabase
- Vérifiez que les clés API sont correctes

## 📝 Notes

- **Mode démo** : Sans clé API SIRENE, l'app fonctionne avec des données factices
- **Design** : Le design original est préservé avec Tailwind CSS
- **Données** : Tous les statuts, funebooster et observations sont sauvegardés dans Supabase

