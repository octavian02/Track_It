// src/pages/SignUp.tsx
import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Snackbar,
  TextField,
  Typography,
  Alert,
  Link,
} from "@mui/material";
import backgroundImage from "../static/war-planet.jpg";
import axios from "axios";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();

  // Simple email regex
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  const validate = () => {
    const newErrors: typeof errors = {
      username: username ? "" : "Username is required",
      email: emailRegex.test(email) ? "" : "Enter a valid email",
      password:
        password.length >= 6 ? "" : "Password must be at least 6 characters",
      confirmPassword:
        confirmPassword === password ? "" : "Passwords must match",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === "");
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      await axios.post("/api/auth/signup", { username, email, password });
      setSnack({
        open: true,
        message: "Signup successful! Redirecting…",
        severity: "success",
      });
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Signup failed";
      setSnack({ open: true, message: msg, severity: "error" });
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
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
      />
      <Box
        component="form"
        onSubmit={handleSignUp}
        sx={{
          position: "relative",
          zIndex: 2,
          width: 300,
          p: 3,
          bgcolor: "rgba(255,255,255,0.9)",
          borderRadius: 2,
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        noValidate
      >
        <Typography variant="h5" align="center">
          Sign Up
        </Typography>

        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={!!errors.username}
          helperText={errors.username}
          fullWidth
          required
        />

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!errors.email}
          helperText={errors.email}
          fullWidth
          required
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
          fullWidth
          required
        />

        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          fullWidth
          required
        />

        <Button type="submit" variant="contained" fullWidth>
          Sign Up
        </Button>

        <Typography variant="body2" align="center">
          Already have an account?{" "}
          <Link component={RouterLink} to="/" underline="hover">
            Log In
          </Link>
        </Typography>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity as any}
            sx={{ width: "100%" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
