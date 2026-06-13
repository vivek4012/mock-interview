import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.js";
import AuthSuccess from "./pages/AuthSuccess.js";
import Dashboard from "./pages/Dashboard.js";
import StartInterview from "./pages/startInterview.js";
import AuthRedirect from "./components/AuthRedirect.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import IterviewPlayground from "./pages/interviewPlayGround.js";
import InterviewResults from "./pages/InterviewResults.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/start-interview"
          element={
            <ProtectedRoute>
              <StartInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-playground"
          element={
            <ProtectedRoute>
              <IterviewPlayground />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-results"
          element={
            <ProtectedRoute>
              <InterviewResults />
            </ProtectedRoute>
          }
        />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
