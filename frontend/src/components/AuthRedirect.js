import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AuthRedirect = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // No token, go to login
        console.log("No token found, redirecting to login");
        navigate("/login");
        return;
      }

      // Verify token is valid
      try {
        console.log("Checking token validity...");
        await axios.get(`${API_BASE_URL}/api/auth/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Token is valid, redirect to dashboard
        console.log("Valid token, redirecting to dashboard");
        navigate("/dashboard");
      } catch (err) {
        // Token is invalid, clear it and go to login
        console.log("Invalid token, redirecting to login");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <p>Checking authentication...</p>
    </div>
  );
};

export default AuthRedirect;
