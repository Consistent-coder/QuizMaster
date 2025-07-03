# 📚 QuizMaster – AI-Powered Quiz Assistant

### A full-stack web application that helps users take quizzes, track their progress, and get AI-powered feedback and analysis using Gemini.

## ✨ Demo Video
[![Watch the video](https://i.ytimg.com/vi/K314IQdnpLk/hqdefault.jpg)](https://youtu.be/K314IQdnpLk?si=ZI0_5vpKOpCas1rO)


## 🚀 Features
📋 Quiz creation & attempt tracking

🧠 AI Assistant: contextual review + chat

📊 User Dashboard with Pie Charts

🧾 Admin-created quizzes with question/option structure

🔒 Auth-protected routes (JWT-based)


## 🛠️ Tech Stack
- Frontend: React + TailwindCSS

- Backend: Node.js + Express

- Database: PostgreSQL (via Prisma)

- AI: Gemini (via @google/genai)

- Authentication: JWT

- UI Charts: Chart.js (via react-chartjs-2)

## 🧪 Setup Instructions

### 1. Clone the repository

```shell
git clone https://github.com/Consistent-coder/QuizMaster.git
cd QuizMaster
```

### 2. Install dependencies
- Server
```shell
cd server
npm install
```
- Client
```shell
cd client
npm install
```

### 3. Configure Environment Variables

- Server:
Create a .env file in the server directory based on the provided .env.example.

```shell
PORT=3000
CLIENT_URL="Your frontend url"

DATABASE_URL="postgresql://<username>:<password>@localhost:<port>/<dbname>"
GEMINI_API_KEY="your_gemini_api_key"

JWT_SECRET="your jwt secret"
JWT_EXPIRES_IN="eg : '7d'"
```

> **AI USAGE NOTE** : You must have your own valid Gemini API key.


### 4. Run the App
- Backend
```shell
cd server
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```shell
cd client
npm run dev
```
