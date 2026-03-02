# Group Project Website (Ver1)

This repository contains a React/Vite application developed as part of a university group project. The site demonstrates product listings, cart functionality, authentication context, theming, and client-side routing.

## 📁 Structure

- `src/` – main application code
  - `app/` – core components, pages, contexts, and routing
  - `styles/` – CSS/Tailwind styles
- `netlify.toml` & `_redirects` – configuration for deploying to Netlify
- `index.html` / `src/main.tsx` – Vite entry points
- Other config files: `package.json`, `vite.config.ts`, etc.

## 🚀 Development

> **Note:** this project now depends on Firebase. Run `npm install firebase` (or `pnpm add firebase`/`yarn add firebase`) before starting the dev server so that TypeScript can resolve `firebase/*` imports.


1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Edit sources under `src/` – changes are hot‑reloaded.

## 🛠 Build

To produce a production build:

```bash
npm run build
```

The output will be placed in the `dist/` directory.

## 🌐 Deployment

### Netlify
1. Connect this GitHub repository to Netlify.
2. Set the build command to `npm run build` and publish directory to `dist`.
3. Ensure `netlify.toml` and `_redirects` are present to handle SPA routing.

Any push to `main` will trigger a deploy (if you enable automatic builds).

### Other Hosts
The contents of `dist/` can also be deployed to any static-hosting service (e.g. GitHub Pages, Vercel, etc.).

## 🔧 Notes

- Uses React Router for navigation, so client-side routing requires a catch-all redirect.

## 🔐 Firebase / Firestore

The app is integrated with Firebase for auth and a Firestore database.

- **Collections**
  - `users` – user profiles created on signup (fields: `name`, `email`, `isAdmin`, etc.)
  - `inventory` – product documents used to populate the shop. Fields include
    `name`, `description`, `price`, `category`, `image`, `rating`, `stock` ("in"/"out" or boolean),
    and can be extended arbitrarily. The frontend fetches all documents on the products page and
    looks up single items by document ID on the product detail page. You may derive a lookup map
    from the fetched array if you prefer hash-style access.
  - `orders` – created when a customer checks out. Each order record contains line items, total
    amount, shipping address, customer information, timestamps and a `status` field. The site
    provides a Checkout page and an Orders page that read/write this collection via the
    `OrderContext`.

- **Rules**
  - Read access to `inventory` is open to all users; write access should be restricted to admins.
  - `users` documents are written automatically via the AuthContext; admin updates can be made
    through the admin panel or Firestore console.

The code reads Firebase configuration from `import.meta.env.VITE_FIREBASE_*`. Environment
variables are injected at build time by Vite, so you should keep them out of the repository.

Create a `.env` file in the **project root** (it’s already listed in `.gitignore`) with the
following keys:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# optional measurement id if you use analytics
VITE_FIREBASE_MEASUREMENT_ID=...
```

A `.env.example` file is provided to show the structure; copy it and fill in your own values.  Do
**not** commit your real credentials.  When deploying (Netlify, Vercel, etc.), set the same
`VITE_FIREBASE_*` variables in the host’s environment settings so the build can access them.

The earlier hardcoded config that was used during development has been removed from the
default `firebase.ts` implementation; the app will fail to initialize if the variables are
missing.  This ensures you don’t accidentally leak keys and makes it easier to switch
between projects or environments.

- All dependencies are managed via npm. React versions are specified in `peerDependencies`.

---

Feel free to fork, modify, or use this as a base for further development.