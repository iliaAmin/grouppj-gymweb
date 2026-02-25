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
- All dependencies are managed via npm. React versions are specified in `peerDependencies`.

---

Feel free to fork, modify, or use this as a base for further development.