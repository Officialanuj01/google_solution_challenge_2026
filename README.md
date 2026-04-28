# 🧠 Pulse: Intelligent Operations for Dark Stores & Retail Supply Chains

## 📚 Table of Contents
- [🚀 Project Overview](#-project-overview)
- [🏆 Problem Statement](#-problem-statement)
- [💡 What Does Pulse Do?](#-what-does-pulse-do)
- [📈 Business Value & Cost](#-business-value--cost)
- [📦 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [⚙️ How It Works](#how-it-works)
- [🚀 Getting Started](#-getting-started)
- [📡 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [🔭 Future Development Roadmap](#-future-development-roadmap)
- [👥 Team & Credits](#-team--credits)

---

## 🚀 Project Overview
**Pulse** is an intelligent, end-to-end AI solution designed to transform modern retail supply chains and high-speed dark store environments. It integrates inventory prediction with delivery automation to reduce wastage and manual workload. 

Built for scale and real-world usability, Pulse uses **Vertex AI** and the **Gemini API** for intelligence, along with **Twilio** for telephony, to help businesses operate smarter and faster. It moves beyond simple dashboards to provide an action-driven approach that actively executes operational tasks.

---

## 🏆 Problem Statement

> **Transforming retail supply chains: From inventory management to last-mile delivery**

Retailers and dark stores contend with critical, costly challenges in high-pressure environments where demand changes rapidly and delivery timelines are tight. These issues erode profitability and brand loyalty:

- **Overstocking**: Leads to the wastage of perishable goods.
- **Understocking**: Results in lost sales and poor customer experience.
- **Failed Deliveries**: Caused by poor proactive communication.
- **Manual Effort**: High operational overhead and manual workload for store operators.

---

## 💡 What Does Pulse Do?

### 📊 **1. Intelligent Stock Optimization**
- Accepts simple CSV sales data from retail stores, requiring no complex setup.
- Forecasts SKU-level demand via historical data to optimize stock by day and location.
- Uses **Vertex AI** for robust demand prediction.
- **Gemini API** generates actionable insights and stock recommendations from predictions.

### 📞 **2. Automated Delivery Coordination**
- Accepts CSV input of customers from delivery partners.
- **Twilio** calling bot automatically contacts each customer proactively before delivery.
- Confirms delivery availability time and instructions.
- Detects failed calls and utilizes an intelligent retry system to queue them for later, ensuring a higher success rate.
- Converts voice responses to text and stores outcomes for operators.

### 🤖 **3. AI-Powered Insights**
- **Gemini API** analyzes sales patterns, anomalies, and delivery data.
- Conversational AI assistant for supply chain questions.
- Store performance summaries and risk assessments.

---

## 📈 Business Value & Cost

Pulse is designed to be a highly practical, scalable solution for multi-store grocery and e-commerce chains.

- **Monthly Cost Estimate**: Approximately ₹1.7k - ₹3.5k per month for 1000 users.
- **Cost Per User**: Operates at an incredibly low cost of approximately ₹2 - ₹3.5 per user per month.
- **Cost Drivers**: The primary cost driver is voice calls (estimated at ₹1-2 per average 1-minute call). AI processing and cloud databases utilize free or very low-cost tiers. 

---

## 📦 Features

- 📁 Upload CSVs for both sales and delivery data.
- 🤖 Data-driven stock planning to reduce stockout risks.
- 📞 AI-powered voice bot integration via **Twilio**.
- 🧠 **Gemini-powered insights** — structured insights, trends, and recommendations.
- 🔌 WebSocket real-time dashboard updates.
- 🛠️ REST APIs via **Render** backend.
- 📊 Intuitive, separate dashboards for Vendor and Delivery processes.
- 🔐 Secure access using Google Auth and JWT.
- 💻 Responsive, modern frontend using React + Tailwind.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, HTML, CSS, JS |
| Backend API | Node.js, Python, Express, REST APIs |
| ML / Prediction | Google Vertex AI, Scikit-learn, Pandas/NumPy, Hugging Face |
| Calling Bot | Twilio API (Automated voice calls, Speech Recognition) |
| AI Insights | Google Gemini API |
| Data & Auth | MongoDB (Logs & Predictions), Google Auth |
| Deployment | Hosting: Vercel & Render. Tools: Git, GitHub, Postman |

---

## 🏗️ Architecture

```text
Frontend (React Dashboard)
        ↓
Render / Backend API (Express)
        ↓
Vertex AI (Demand Forecasting)
        ↓
Twilio (Automated Call Bot & Webhooks)
        ↓
Gemini API (Call Analysis & Insights Summaries)