# Pulse — Client-side Web Application

The frontend client-side web application for **Pulse**, an AI-powered retail supply chain optimization platform. This dashboard enables users to manage inventory, forecast demand, and optimize logistics with rich, interactive visualizations and smooth, premium animations.

## Key Features & Pages  

- **Home & Dashboard**: A comprehensive landing page and dashboard summarizing platform metrics, supply chain status, and quick actions.
- **Predict (Demand Forecasting)**: Interactive charts and analytics utilizing **Recharts** to visualize sales trends, seasonal demands, and AI-driven supply forecasting .
- **SmartDrop (Logistics Optimizer)**: A utility to streamline distribution planning, manage routes, and coordinate intelligent drop-offs.
- **Google OAuth Authentication**: Secure authentication via `@react-oauth/google` for seamless sign-in.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) (fast HMR and bundling)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion (Framer Motion)](https://motion.dev/) & `motion-primitives` for smooth micro-animations and interactive UI transitions
- **Charts & Data Viz**: [Recharts](https://recharts.org/) for data dashboard components
- **Routing**: [React Router DOM v7](https://reactrouter.com/) for Single Page Application (SPA) routing
- **Data Parsing**: [PapaParse](https://www.papaparse.org/) for handling client-side CSV parsing/uploading

## Getting Started

### 1. Install Dependencies
Navigate to the `client-side` directory and install the required npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the `client-side` folder (refer to configuration in `src/config.js`):
```env
VITE_API_URL=http://localhost:5001/api
VITE_WS_URL=ws://localhost:5001
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

### 3. Run Development Server
Start the local development server:
```bash
npm run dev
```

### 4. Build for Production
Generate the production-ready build artifacts:
```bash
npm run build
```

## Deploy on Google Cloud

The client-side app is a Vite single-page application, so the simplest Google Cloud path is **Firebase Hosting**. The repo now includes an SPA rewrite config that serves `dist/index.html` for deep links such as `/predict` and `/smartdrop`.

### 1. Prerequisites
- Create a Firebase project in Google Cloud
- Install the Firebase CLI: `npm install -g firebase-tools`
- Sign in: `firebase login`

### 2. Configure the frontend environment
Create a `.env` file in `client-side/`:
```env
VITE_API_URL=https://your-backend-url/api
VITE_WS_URL=wss://your-backend-url
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### 3. Build and deploy
```bash
cd client-side
npm install
npm run build
firebase deploy --only hosting
```

### 4. Firebase setup notes
- The hosting root is `dist`
- SPA routing is handled by a rewrite to `/index.html`
- If you want a custom domain, configure it from the Firebase Hosting console after the first deploy
