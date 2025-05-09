# Dysautonomia Vital Tracking and Monitoring System

This is a full-stack application for tracking and monitoring dysautonomia-related patient data. Patients can log symptoms and vitals, while healthcare providers can monitor trends, manage clinical notes, and receive alerts for abnormal vitals.

---

## 🗂️ Project Structure

```
repo/
├── backend/
│   ├── app.py
│   ├── controllers/
│   ├── models/
│   ├── static/
│   ├── templates/
│   ├── tests/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── assets/
│   │   └── logo.png
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── alerts.js
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── health_summary.js
│   │   ├── provider.js
│   │   ├── symptoms.js
│   │   └── vitals.js
│   └── index.html
```

---

## ⚙️ Setup Instructions

### 🔧 Step 1: Create Virtual Environment (WSL/Linux)

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## ▶️ Running the Application

### 🖥 Terminal 1 – Run Backend

```bash
cd backend
python app.py
```

> Flask backend will run at `http://localhost:5000`

---

### 🌐 Terminal 2 – Run Frontend

```bash
cd frontend
python3 -m http.server 8000
```

> Frontend will run at `http://localhost:8000`

---

## 🔑 Authentication Routes

- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Login and receive JWT
- `GET /api/auth/profile` – View user profile
- `POST /api/auth/refresh` – Get new access token

---

## 💉 Vitals & Alerts

- `POST /api/vitals/` – Add new vital record
- `GET /api/vitals/` – Get user's vital records
- `GET /api/alerts/` – View alerts (abnormal vitals)
- `PUT /api/alerts/<alert_id>/read` – Mark alert as read

---

## 🤒 Symptoms

- `POST /api/symptoms/` – Log a new symptom
- `GET /api/symptoms/` – Fetch logged symptoms

---

## 🩺 Healthcare Provider Routes

- `GET /api/health/patients` – View all patients
- `GET /api/health/notes?patient_id=<id>` – View clinical notes
- `POST /api/health/notes` – Add a clinical note

---

## 📈 Health Summary & Trends

- `GET /api/health/summary` – Get patient health summary
- `GET /api/health/trends` – View trends of a vital type

---

## 🧪 Running Backend Tests

```bash
cd backend
cd tests
coverage run -m pytest
coverage report -m 
```

---

## 🔐 User Types

- **patient** – Can log vitals and symptoms
- **healthcare_provider** – Can access patient data, write notes, view alerts

---

## 🗒 Example `.env` file for backend

Create a `.env` file in the `backend/` directory:

```
DATABASE_URI=sqlite:///dysautonomia.db
JWT_SECRET_KEY=super-secret
```

---

## 📦 Requirements

- Python 3.8+
- Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt
- Node.js (if needed for frontend development)
