# 🧠 Predelix: AI-Powered Retail Supply Chain & Last-Mile Delivery Platform

## 📚 Table of Contents
- [🚀 Project Overview](#-project-overview)
- [🏆 Problem Statement](#-problem-statement)
- [💡 What Does Predelix Do?](#-what-does-predelix-do)
- [📦 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [⚙️ How It Works](#how-it-works)
- [🚀 Getting Started](#-getting-started)
- [📡 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [🔭 Ongoing Development](#-ongoing-development)
- [👥 Team & Credits](#-team--credits)

---

## 🚀 Project Overview
**Predelix** is an intelligent, end-to-end AI solution designed to transform modern retail supply chains. It addresses two key operational pain points:
1. **Inventory Demand Forecasting** – helping vendors prevent stockouts and overstocking.
2. **Last-Mile Delivery Coordination** – automating customer communication via Twilio-powered voice bots.

Built for scale and real-world usability, Predelix leverages **Google Cloud Platform** services including Vertex AI and Gemini, along with **Twilio** for telephony, to help businesses operate smarter and faster.

---

## 🏆 Problem Statement

> **Transforming retail supply chains: From inventory management to last-mile delivery**
Retailers contend with two critical, costly challenges:

Inventory Imbalance: Manual forecasting leads to stockouts (lost sales, unhappy customers) or overstock (excess capital tied up, waste).

Delivery Inefficiency: Unconfirmed delivery windows result in failed drop‑offs, wasted driver time, and poor customer experience.
These issues occur daily across all stores and delivery zones—especially during peak seasons—eroding profitability and brand loyalty.

---

## 💡 What Does Predelix Do?

### 📊 **1. Intelligent Stock Optimization**
- Accepts CSV sales data from retail stores.
- Predicts store-level demand by date and SKU using **Vertex AI**.
- **Gemini API** generates actionable insights from predictions.
- Ensures vendors always stock the right quantity, at the right time, in the right store.

### 📞 **2. Automated Delivery Coordination**
- Accepts CSV input of customers from delivery partners.
- **Twilio** calling bot automatically contacts each customer to:
  - Confirm delivery availability time.
  - Ask for specific delivery instructions.
- Twilio records customer responses for review.
- Missed/disconnected calls are queued for retry.

### 🤖 **3. AI-Powered Insights (NEW)**
- **Gemini API** analyzes sales patterns, anomalies, and delivery data.
- Conversational AI assistant for supply chain questions.
- Store performance summaries and risk assessments.

---

## 📦 Features

- 📁 Upload CSVs for both sales and delivery data.
- 🤖 AI prediction for store-level stock needs via **Vertex AI**.
- 📞 Voice bot integration via **Twilio**.
- 🧠 **Gemini-powered insights** — trends, anomalies, recommendations.
- 🔌 WebSocket real-time dashboard updates.
- 🛠️ REST APIs via **Cloud Run** backend.
- 📊 Intuitive dashboards for vendors and delivery partners.
- 🔐 Secure authentication with JWT + Google OAuth.
- 💻 Responsive, modern frontend using React + Tailwind.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Vite |
| Backend API | Node.js, Express (Cloud Run) |
| ML / Prediction | Google Vertex AI |
| Calling Bot | Twilio |
| AI Insights | Google Gemini API |
| Authentication | JWT + Google OAuth 2.0 |
| File Storage | Google Cloud Storage |
| CI/CD | Cloud Build |
| Deployment | Cloud Run (containerized) |

---

## 🏗️ Architecture

```
Frontend (React Dashboard)
        ↓
Cloud Run / Backend API
        ↓
Vertex AI (prediction)
        ↓
Twilio (calling bot)
        ↓
Gemini API (insights)
```

### Project Structure:
```
Predelix/
├── client-side/          # React Dashboard (Vite + Tailwind)
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── services/     # API service layer
│       │   ├── auth.service.js
│       │   ├── prediction.service.js    (Vertex AI)
│       │   ├── delivery.service.js      (Twilio)
│       │   ├── insights.service.js      (Gemini API)
│       │   └── realtime.service.js      (WebSocket)
│       └── context/      # React context providers
│
├── backend/              # Cloud Run Backend API
│   ├── src/
│   │   ├── config/       # Service configurations
│   │   ├── routes/       # Express routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, CORS, error handling
│   │   └── models/       # Data models
│   ├── Dockerfile        # Cloud Run container
│   └── cloudbuild.yaml   # CI/CD pipeline
│
├── vertex-ai/            # Vertex AI model training
│   └── training/
│       ├── train_demand_model.py
│       └── config.yaml
│
└── infrastructure/       # Deployment scripts
    └── deploy.sh
```

---

## ⚙️ How It Works

### 🧮 Stock Prediction Workflow:
1. Vendor uploads sales CSV via React dashboard.
2. Backend sends data to **Vertex AI** model for prediction.
3. **Vertex AI** model predicts next 7 days of demand per store/product.
4. Results returned to dashboard via API response.
5. **Gemini API** generates insights and recommendations.

### 📞 Delivery Workflow:
1. Delivery partner uploads customer CSV.
2. Backend stores customer data and triggers **Twilio** calls.
3. **Twilio** makes automated calls with TwiML voice prompts.
4. Customer responses are recorded via Twilio.
5. Call status and recordings available on dashboard.
6. Failed calls queued for retry via dashboard "Retry Call" button.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Cloud SDK (`gcloud`)
- GCP Project with billing enabled
- Twilio account with verified phone number

### Backend Setup:
```bash
cd backend
cp .env.example .env  # Configure your credentials
npm install
npm run dev
```

### Frontend Setup:
```bash
cd client-side
npm install
npm run dev
```

### Deploy to GCP:
```bash
# Set your project ID
export GCP_PROJECT_ID=your-project-id

# Run the deployment script
chmod +x infrastructure/deploy.sh
./infrastructure/deploy.sh
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/role` | Update user role |

### Predictions (Vertex AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict` | Upload sales CSV & get predictions |
| POST | `/api/predict/train` | Submit training job to Vertex AI |
| GET | `/api/predict/results` | Fetch prediction results |

### Delivery (Twilio)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/delivery/upload` | Upload delivery customer CSV |
| POST | `/api/delivery/trigger` | Trigger automated calls |
| GET | `/api/delivery/results` | Fetch call status & recordings |
| POST | `/api/delivery/retry` | Retry failed calls |

### Insights (Gemini API)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/insights/sales` | Generate sales insights |
| POST | `/api/insights/delivery` | Generate delivery insights |
| GET | `/api/insights/store/:id` | Get store performance summary |
| POST | `/api/insights/chat` | Conversational AI chat |

### Events (WebSocket)
| Method | Endpoint | Description |
|--------|----------|-------------|
| WS | `/api/events/ws` | Real-time WebSocket |
| GET | `/api/events/status` | Event system status |

---

## 🤝 Contributing
We welcome contributions to improve Predelix! Here's how to get started:

```bash
# Fork the repo
git fork https://github.com/DSAops/Predelix.git

# Clone and create a new branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Added amazing feature"

# Push and create a pull request
git push origin feature/amazing-feature
```

---

## 🔭 Ongoing Development
We are continuously working on expanding the platform with:
- 🌍 Multilingual voice support
- 🗺️ Google Maps integration for delivery optimization

Track progress here:
📌 GitHub Repo: [https://github.com/DSAops/Predelix](https://github.com/DSAops/Predelix)

---

## 👥 Team & Credits
**Team Predelix**
- Anuj Sahu – Fullstack Developer
- Devraj Patil – Fullstack Developer
- Saksham Gupta – Fullstack Developer

---

## 📬 Contact
Need a demo or have questions?
📧 Email us at: officialanuj004@gmail.com

---

Predelix: Powering the future of retail supply chains with AI.

> 🚧 **Disclaimer:** This repository contains a hackathon prototype built for learning and demo purposes only.
>
> 💡 Made with ❤️ by Team DSA. (Devraj, Saksham, and Anuj)
