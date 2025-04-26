// src/pages/MainPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";

import MovieCarousel from "../components/MovieCarousel";
import ShowCarousel from "../components/ShowCarousel";
import HeroCarousel, { BannerMedia } from "../components/HeroCarousel";
import "./MainPage.css";

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
}

export interface Show {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
}

const MainPage: React.FC = () => {
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [trendingShows, setTrendingShows] = useState<Show[]>([]);
  const [popularShows, setPopularShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [
          { data: tMovies },
          { data: pMovies },
          { data: tShows },
          { data: pShows },
        ] = await Promise.all([
          axios.get("/api/movies/trending"),
          axios.get("/api/movies/popular"),
          axios.get("/api/shows/trending"),
          axios.get("/api/shows/popular"),
        ]);

        setTrendingMovies(tMovies.results.slice(0, 10));
        setPopularMovies(pMovies.results.slice(0, 10));
        setTrendingShows(tShows.results.slice(0, 10));
        setPopularShows(pShows.results.slice(0, 10));

        setFeatured(tMovies.results[0] || null);
      } catch (err) {
        console.error("Failed loading data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

  return (
    <div className="main-page">
      <HeroCarousel
        items={[
          ...trendingMovies.slice(0, 3).map(
            (m): BannerMedia => ({
              ...m,
              resourceType: "movie",
            })
          ),
          ...trendingShows.slice(0, 3).map(
            (s): BannerMedia => ({
              ...s,
              title: s.name,
              overview: s.overview, // ← include the show’s overview
              resourceType: "tv",
            })
          ),
        ]}
      />

      <section className="section">
        <MovieCarousel title="Trending Movies" movies={trendingMovies} />
        <MovieCarousel title="Popular Movies" movies={popularMovies} />
        <ShowCarousel title="Trending TV Shows" shows={trendingShows} />
        <ShowCarousel title="Popular TV Shows" shows={popularShows} />
      </section>
    </div>
  );
};

export default MainPage;
