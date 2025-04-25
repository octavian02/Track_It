import React, { useState, useEffect } from "react";
import axios from "axios";

import HeroBanner from "../components/HeroBanner";
import MovieCarousel from "../components/MovieCarousel";

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

const MainPage: React.FC = () => {
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

        const take10 = (arr: Movie[]) => arr.slice(0, 10);
        setTrending(take10(tData.results));
        setPopular(take10(pData.results));
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

  return (
    <div className="main-page">
      {featured && (
        <section className="banner-section">
          <HeroBanner
            media={{
              id: featured.id,
              title: featured.title,
              overview: featured.overview,
              backdrop_path: featured.backdrop_path,
            }}
            resourceType="movie"
            onInfo={(m) => console.log("Movies More Info", m.id)}
            onToggleWatchlist={(m) => console.log("Movies WL", m.id)}
          />
        </section>
      )}

      <section className="section">
        <MovieCarousel title="Trending Now" movies={trending} />
      </section>

      <section className="section">
        <MovieCarousel title="Popular" movies={popular} />
      </section>
    </div>
  );
};

export default MainPage;
