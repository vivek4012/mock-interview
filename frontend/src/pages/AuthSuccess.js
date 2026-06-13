import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only run once on mount
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    console.log("=== AUTH SUCCESS: Processing token ===");
    console.log("URL:", window.location.pathname);
    console.log("Token:", token ? "Found ✓" : "Not found ✗");

    if (token) {
      localStorage.setItem("token", token);
      console.log("✓ Token saved, navigating to dashboard...");
      // Use window.location to force a full navigation
      window.location.href = "/dashboard";
    } else {
      console.log("✗ No token, redirecting to login");
      window.location.href = "/login";
    }
  }, []); // Empty dependency array - run only once

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h3>Signing you in...</h3>
    </div>
  );
};

export default AuthSuccess;
