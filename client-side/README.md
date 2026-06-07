# Pulse — Client-side Web Application

The frontend client-side web application for **Pulse**, an AI-powered retail supply chain optimization platform. This dashboard enables users to manage inventory, forecast demand, and optimize logistics with rich, interactive visualizations and smooth, premium animations.

## Key Features & Pages

- **Home & Dashboard**: A comprehensive landing page and dashboard summarizing platform metrics, supply chain status, and quick actions.
- **Predict (Demand Forecasting)**: Interactive charts and analytics utilizing **Recharts** to visualize sales trends, seasonal demands, and AI-driven supply forecasting.
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
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
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
