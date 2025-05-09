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
import ShowDetails from "./pages/ShowDetails";
import TvShowsPage from "./pages/TvShowPage";
import ShowCredits from "./pages/ShowCredits";
import MoviePage from "./pages/MoviePage";
import { WatchlistProvider } from "./contexts/WatchlistContext";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import SearchPage from "./pages/SearchPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import ShowSeasons from "./pages/ShowSeasons";
import TrackShowsPage from "./pages/TrackShowsPage";
import WatchlistPage from "./pages/WatchlistPage";
import RatingsPage from "./pages/RatingsPage";
import RecommendationsPage from "./pages/RecommendationsPage";

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
        <Route path="/movies" element={<MoviePage />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/movie/:id/credits" element={<MovieCredits />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/tv" element={<TvShowsPage />} />
        <Route path="/tv/:id" element={<ShowDetails />} />
        <Route path="/tv/:id/credits" element={<ShowCredits />} />
        <Route path="tv/:id/seasons" element={<ShowSeasons />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/user/:username/profile" element={<ProfilePage />} />
        <Route path="/track" element={<TrackShowsPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/user/:username/watchlist" element={<WatchlistPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/user/:username/ratings" element={<RatingsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
      </Route>
    </>
  )
);

root.render(
  <React.StrictMode>
    <WatchlistProvider>
      <NotificationProvider>
        <AuthProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <RouterProvider router={router} />
          </LocalizationProvider>
        </AuthProvider>
      </NotificationProvider>
    </WatchlistProvider>
  </React.StrictMode>
);
