import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, TextField, Typography } from "@mui/material";
import backgroundImage from "../static/dark-wallpaper.jpg";
import axios from "axios";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (event: any) => {
    event.preventDefault();
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      const token = data.access_token;
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      window.location.href = "/track";
    } catch (err: any) {
      if (err.response) {
        setError("Invalid username or password");
      } else if (err.request) {
        setError("No response from the server");
      } else {
        setError("Login failed: " + err.message);
      }
      console.error("Login error:", err);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          zIndex: 1,
        }}
      ></div>
      <form
        onSubmit={handleLogin}
        style={{
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          width: "300px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Typography
          variant="h4"
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          Log In
        </Typography>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <Typography
          color="error"
          style={{ marginTop: "10px", textAlign: "center" }}
        >
          {error}
        </Typography>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          style={{ marginTop: "20px" }}
        >
          Log In
        </Button>
        <Typography style={{ marginTop: "20px", textAlign: "center" }}>
          New here?{" "}
          <Link
            to="/signup"
            onClick={() => navigate("/signup")}
            style={{ cursor: "pointer" }}
          >
            {" "}
            Sign Up
          </Link>
        </Typography>
      </form>
    </div>
  );
};

export default LoginPage;
