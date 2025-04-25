import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, TextField, Typography } from "@mui/material";
import backgroundImage from "../static/war-planet.jpg";
import axios from "axios";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (event: any) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await axios.post("/api/auth/signup", {
        username,
        email,
        password,
      });
      navigate("/");
    } catch (error: any) {
      console.error("Failed to signup:", error.response.data);
      alert(
        "Signup failed: " + (error.response.data.message || "Unknown Error")
      );
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
        onSubmit={handleSignUp}
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
          variant="h5"
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          Sign Up
        </Typography>
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
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
        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Sign Up
        </Button>
        <Typography style={{ marginTop: "20px", textAlign: "center" }}>
          Already have an account?{" "}
          <Link
            to="/"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            Log In
          </Link>
        </Typography>
      </form>
    </div>
  );
};

export default SignUp;
