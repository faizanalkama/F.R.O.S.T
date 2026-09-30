<div align="center">
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <br />
  <img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
</div>

<br />

<div align="center">
  <h1 align="center">F.R.O.S.T. (Project Aegis / BovineGuard AI) 🐄🛡️</h1>
  <p align="center">
    <strong>End-to-End IoT Hardware & Full-Stack Intelligence for Predictive Bovine Mastitis Monitoring.</strong>
    <br />
    <em>Smart India Hackathon (SIH) 2026 — Hardware Track Submission</em>
  </p>
</div>

---

## 📖 Project Overview

Bovine mastitis is one of the most debilitating and economically damaging diseases in the global dairy industry, leading to massive losses in milk yield and compromised animal welfare. Current industry solutions are largely reactive—relying on visible clinical symptoms or periodic manual testing long after the infection has taken hold.

**F.R.O.S.T. (BovineGuard AI)** revolutionizes herd management through a proactive, predictive IoT architecture. By deploying non-invasive hardware (smart collars and udder sensors) connected to local gateway hubs, our system captures real-time physiological telemetry from the livestock. This high-frequency data is streamed directly to our Python-powered Machine Learning microservice, which predicts the onset of mastitis *before* clinical symptoms emerge, enabling immediate, targeted intervention.

---

## 🔗 Live Deployment Links

| Resource | Link |
| :--- | :--- |
| **Production Application** | [https://frost-hackcypher.netlify.app](https://frost-hackcypher.netlify.app) |
| **Node.js Core API** | [https://frost-backend.onrender.com](https://frost-backend.onrender.com) |
| **GitHub Repository** | [Ayan933710/F.R.O.S.T](https://github.com/Ayan933710/F.R.O.S.T) |
| **Video Walkthrough** | *(Insert YouTube Demo Link Here)* |

---

## 🏗️ Cloud Architecture & Data Flow

Our architecture utilizes a highly scalable microservice design, strictly secured via CORS domain-locking and dynamic environment variables to ensure zero data leakage between the hardware and the cloud.

```mermaid
graph TD
    subgraph IoT Edge Hardware
        S1[Udder Sensors] -->|Telemetry/BLE| G[Central Gateway Hub]
        S2[Smart Collars] -->|Movement/BLE| G
    end

    subgraph Cloud Backend Services (Render)
        G -->|HTTPS POST| NodeAPI[Node.js / Express API]
        NodeAPI <-->|REST/WebSockets| ML[Python ML Service]
    end

    subgraph Data Persistence
        NodeAPI -->|Mongoose ODM| Mongo[(MongoDB Atlas)]
    end

    subgraph Presentation Layer (Netlify)
        NodeAPI -->|Live Dashboards| React[React 18 / Vite SPA]
        React -->|3D Hardware Renders| ThreeJS[Three.js / Drei]
    end

    classDef hardware fill:#2d3748,stroke:#4a5568,color:#fff;
    classDef cloud fill:#2b6cb0,stroke:#2c5282,color:#fff;
    classDef db fill:#276749,stroke:#22543d,color:#fff;
    classDef ui fill:#805ad5,stroke:#553c9a,color:#fff;
    
    class S1,S2,G hardware;
    class NodeAPI,ML cloud;
    class Mongo db;
    class React,ThreeJS ui;
```

---

## 🚀 Key Capabilities

*   **🔮 Predictive ML Alerts:** The Python microservice continuously analyzes physiological inputs against historical disease models to generate probability scores for sub-clinical mastitis.
*   **🌐 Real-Time Analytics Dashboard:** Utilizing **Recharts**, the frontend visualizes complex telemetry arrays (temperature, conductivity, activity) in sleek, responsive graphs.
*   **🛠️ Interactive 3D Hardware Renders:** Judges and users can interact with live 3D models of our IoT collars and sensors natively in the browser, powered by **React Three Fiber** and **Drei**.
*   **✨ Immersive UX/UI:** Fluid page transitions, glassmorphism aesthetics, and dynamic rendering via **Framer Motion** and **Tailwind CSS**.
*   **🔒 Enterprise Security:** Single Page Application (SPA) routing is handled flawlessly via Netlify `_redirects`. Backend access is locked strictly to the frontend domain via rigorous CORS policies.

---

## ⚙️ Environment Configuration

To run this platform locally or deploy to a new environment, configure the following `.env` files in their respective directories.

### 1. Frontend (`/frontend/.env`)
```env
# Point to your local or live backend services
VITE_BACKEND_URL=http://localhost:5000
VITE_ML_URL=http://localhost:8000
```

### 2. Node Backend (`/backend/.env`)
```env
# MongoDB Connection String & Allowed Frontend Origin
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/frost?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
```

### 3. Python ML Service (`/ml_service/.env`)
```env
# Allowed Frontend Origin for CORS
PORT=8000
FRONTEND_URL=http://localhost:5173
```

---

## 💻 Local Setup & Installation

Clone the repository and spin up all three microservices concurrently. 

**1. Clone the repository:**
```bash
git clone https://github.com/Ayan933710/F.R.O.S.T.git
cd F.R.O.S.T
```

**2. Start the Node.js API (Backend):**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

**3. Start the Python ML Service:**
```bash
# Open a new terminal
cd ml_service
python -m venv .venv
# Activate venv: .\.venv\Scripts\activate (Windows) or source .venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

**4. Start the React Frontend:**
```bash
# Open a new terminal
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 👥 Team HackCypher
**Heritage Institute of Technology, Kolkata**

| Member | Role | GitHub |
| :--- | :--- | :--- |
| **Harsh** | Repository Lead & IoT Architecture |  |
| **Faizan Alkama** | Full-Stack Cloud Deployment & ML Ops | *(Insert Link)* |
| **[Name]** | Hardware Engineering / Sensor Calibrations | *(Insert Link)* |
| **[Name]** | UI/UX Design & 3D Integration | *(Insert Link)* |
| **[Name]** | Backend Development & Database Modeling | *(Insert Link)* |
| **[Name]** | Researcher & Pitch Strategist | *(Insert Link)* |

<br/>
<div align="center">
  <i>Developed with precision and care for the <b>Smart India Hackathon 2026</b>.</i>
</div>
