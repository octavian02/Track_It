import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import "./index.css";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import SignUp from "./components/SignUp";
import MovieDetails from "./pages/MovieDetails";
import PublicLayout from "./layout/PublicLayour";
import AppLayout from "./layout/AppLayout";
import MovieCredits from "./pages/MovieCredits";
import axios from "axios";
import { NotificationProvider } from "./components/NotificationsContext";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import { AuthProvider } from "./contexts/AuthContext";

const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const root = createRoot(document.getElementById("root")!);

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* PUBLIC ROUTES (no header/footer) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>

      {/* APP ROUTES (with header+footer) */}
      <Route element={<AppLayout />}>
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/movie/:id/credits" element={<MovieCredits />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
    </>
  )
);

root.render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);
