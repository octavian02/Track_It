// src/pages/MoviesPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";

import HeroBanner from "../components/HeroBanner";
import MovieCarousel from "../components/MovieCarousel";
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

const MoviePage: React.FC = () => {
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: tData }, { data: pData }] = await Promise.all([
          axios.get("/api/movies/trending"),
          axios.get("/api/movies/popular"),
        ]);

        const top10 = (arr: Movie[]) => arr.slice(0, 10);
        setTrending(top10(tData.results));
        setPopular(top10(pData.results));
        setFeatured(tData.results[0] || null);
      } catch (err) {
        console.error("Failed loading movies", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

  const carouselItems: BannerMedia[] = [
    ...trending
      .slice(0, 3)
      .map((m): BannerMedia => ({ ...m, resourceType: "movie" })),
    ...popular
      .slice(0, 3)
      .map((m): BannerMedia => ({ ...m, resourceType: "movie" })),
  ];

  return (
    <div className="main-page">
      <HeroCarousel items={carouselItems} />
      <section className="section">
        <MovieCarousel title="Trending Now" movies={trending} />
        <MovieCarousel title="Popular" movies={popular} />
      </section>
    </div>
  );
};

export default MoviePage;
