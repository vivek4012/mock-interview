# Mock Interview Platform — Frontend

React SPA that lets users configure and conduct AI-powered mock interviews. Users log in with Google, provide their job details, and go through a live interview where AssemblyAI transcribes their speech in real time and GPT-4 asks adaptive follow-up questions.

## Tech Stack

- **Framework:** React 19 + Vite 7
- **Routing:** React Router v7
- **Styling:** Tailwind CSS + shadcn/ui components
- **HTTP:** Axios
- **Auth:** JWT stored in localStorage
- **Speech:** AssemblyAI Universal Streaming (browser WebSocket)

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.js              # Google OAuth login screen
│   │   ├── AuthSuccess.js        # Handles token from OAuth redirect
│   │   ├── Dashboard.js          # Interview history + scores
│   │   ├── startInterview.js     # Interview setup form
│   │   ├── interviewPlayGround.js # Live interview UI
│   │   └── InterviewResults.js   # Post-interview analysis
│   ├── components/
│   │   ├── AuthRedirect.js       # Redirects / based on auth state
│   │   ├── ProtectedRoute.js     # Guards authenticated routes
│   │   ├── GoogleLoginButton.js  # Google OAuth trigger
│   │   └── ui/                   # shadcn/ui components
│   ├── utils/
│   │   └── auth.js               # isAuthenticated(), logout()
│   ├── App.jsx                   # Routes definition
│   └── main.jsx                  # Entry point
├── .env.example                  # Environment variable template
└── vite.config.js
```

## Pages & User Flow

```
/ (AuthRedirect)
 ├── not logged in → /login
 └── logged in     → /dashboard

/login               Google OAuth button
/auth/success        Captures token from redirect, stores in localStorage
/dashboard           Interview history table with scores
/start-interview     Form: designation, experience, area to focus, JD
/interview-playground  Live interview — speech input + AI questions
/interview-results   Scores, strengths, areas to improve, behavioral traits
```

## Environment Variables

Create a `.env` file in the `frontend/` directory (use `.env.example` as a reference):

```env
VITE_API_BASE_URL=http://localhost:5001
```

For production, set this to your deployed backend URL.

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs on `http://localhost:5173`. The backend proxy is set to `http://localhost:5001`.

## Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Deployed on Vercel. The `vercel.json` rewrites all routes to `index.html` for client-side routing.

```bash
vercel deploy
```

Set `VITE_API_BASE_URL` in Vercel dashboard under **Project → Settings → Environment Variables**.

## Authentication Flow

1. User clicks **Login with Google** → redirected to `GET /api/auth/google`
2. Google redirects back to backend callback
3. Backend issues a JWT and redirects to `/auth/success?token=<jwt>`
4. `AuthSuccess` page captures the token, saves to `localStorage`, redirects to `/dashboard`
5. All subsequent API calls include `Authorization: Bearer <token>`

## Interview Flow

1. **Setup** (`/start-interview`) — user fills designation, years of experience, area to focus, and pastes the job description
2. **Live Interview** (`/interview-playground`) — backend returns an AssemblyAI streaming token; browser connects via WebSocket for real-time transcription; GPT-4 generates the next question after each answer
3. **End Interview** — user ends the session; backend marks it `completed`
4. **Analysis** (`/interview-results`) — GPT-4 evaluates the full transcript and returns scores for technical ability, communication, confidence, clarity, and problem-solving, along with strengths, areas to improve, and recommended resources
