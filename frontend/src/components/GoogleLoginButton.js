import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const GoogleLoginButton = () => {
  const handleLogin = () => {
    // Redirect user to backend Google OAuth route
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#4285F4",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "6px",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        style={{ width: "20px", height: "20px" }}
      />
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;