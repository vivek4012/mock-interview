import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        // No token, redirect to login
        navigate("/login");
        return;
      }

      // Verify token is valid by calling the backend
      try {
        await axios.get(`${API_BASE_URL}/api/auth/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Token is valid, allow access
        setIsChecking(false);
      } catch (err) {
        // Token is invalid or expired, clear it and redirect to login
        console.log("Invalid token, redirecting to login");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    checkAuth();
  }, [token, navigate]);

  if (isChecking) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
