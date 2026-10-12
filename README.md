# gedi — कार रेडियो 🚗📻

> *"सड़क से सीधे, एक गीत और."*  
> A nostalgic, warm loop of timeless Bollywood pop from 2010–2014, experienced live from the driver's seat.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kitrak005/Gedi-car-music-player-)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- **🚗 Immersive Driver POV Atmosphere**: High-definition cinematic dashboard photography placing you directly behind the steering wheel on Indian highways and city night drives.
- **🎨 4 Dynamic Thematic Routes**:
  - 🛣️ **Open Road**: Warm bulbs & dusk blue hour on the open highway.
  - ☕ **Chai Stop**: Roadside tea stall tapri with steam & golden tungsten glows.
  - 🌃 **Night Drive**: Mumbai-style illuminated expressway with neon sign bokeh.
  - 🌧️ **Monsoon Route**: Rainy windshield with wiper sweeps and reflections.
- **🌧️ "Baarish?" Ambient Mode**: A toggleable ambient rain layer with custom atmospheric sound and independent volume mixing alongside the music.
- **🎵 Curated 2010–2014 Bollywood Catalog**: Handpicked nostalgic classics (*Pee Loon*, *Tum Se Hi*, *Kun Faya Kun*, *Sadda Haq*, and more) streaming official audio and video with rotating vinyl album art.
- **📱 True-to-Life Responsive Proportions**: Custom proportional scaling preserves the authentic desktop dashboard layout, 3-column bottom player, and topbar alignment across all mobile viewports without vertical collapse.
- **⚡ Zero Third-Party Watermarks**: Clean, lightweight, self-hosted aesthetic without external badge overlays.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Vanilla CSS glassmorphism & fluid proportional sizing
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [tRPC v11](https://trpc.io/)
- **ORM & Database**: [Drizzle ORM](https://orm.drizzle.team/), MySQL2

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Clone the repository
```bash
git clone https://github.com/kitrak005/Gedi-car-music-player-.git
cd Gedi-car-music-player-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Project Structure

```text
├── client/
│   ├── public/
│   │   ├── songs.json        # Curated track metadata & YouTube IDs
│   │   └── themes/           # High-resolution driver POV backgrounds
│   └── src/
│       ├── components/       # UI building blocks
│       ├── pages/
│       │   └── Home.tsx      # Main radio player interface & state
│       └── index.css         # Glassmorphism design tokens & responsive CSS
├── server/
│   ├── _core/                # Express & Vite development server setup
│   ├── routers.ts            # tRPC API procedures
│   └── storage.ts            # Media storage helpers
├── vercel.json               # Vercel deployment & SPA routing configuration
└── package.json
```

---

## 🚢 Deployment (Vercel)

The repository is pre-configured for one-click deployment on [Vercel](https://vercel.com):

1. Import your GitHub repository into Vercel.
2. The pre-configured `vercel.json` will automatically build the static bundle to `dist/public` and set up client-side SPA routing.
3. Deploy!

---

## 📬 Contact & Support

If you have feedback, song suggestions, or want to say hello:
- **Email**: [joshikartik.1925@gmail.com](mailto:joshikartik.1925@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
