// src/pages/TvShowsPage.tsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ShowCarousel from "../components/ShowCarousel";
import { useNotify } from "../components/NotificationsContext";
import "./MainPage.css"; // reuse your main page styles
import HeroCarousel, { BannerMedia } from "../components/HeroCarousel";

interface ShowFull {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
}

const TvShowsPage: React.FC = () => {
  const [featured, setFeatured] = useState<ShowFull | null>(null);
  const [trending, setTrending] = useState<ShowFull[]>([]);
  const [popular, setPopular] = useState<ShowFull[]>([]);
  const [topRated, setTopRated] = useState<ShowFull[]>([]);
  const [airing, setAiring] = useState<ShowFull[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    (async () => {
      try {
        const [t, p, r, a] = await Promise.all([
          axios.get("/api/shows/trending"),
          axios.get("/api/shows/popular"),
          axios.get("/api/shows/top-rated"),
          axios.get("/api/shows/airing-today"),
        ]);

        const take10 = (arr: any[]) => arr.slice(0, 10);
        setTrending(
          take10(t.data.results.map((s: any) => ({ ...s, name: s.name })))
        );
        setPopular(
          take10(p.data.results.map((s: any) => ({ ...s, name: s.name })))
        );
        setTopRated(
          take10(r.data.results.map((s: any) => ({ ...s, name: s.name })))
        );
        setAiring(
          take10(a.data.results.map((s: any) => ({ ...s, name: s.name })))
        );

        const allTrending: ShowFull[] = t.data.results;
        setFeatured(allTrending[0] || null);
      } catch (err) {
        console.error("Failed loading TV shows", err);
        notify({ message: "Could not load TV shows", severity: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

  const carouselItems: BannerMedia[] = [
    ...trending.slice(0, 3).map(
      (s): BannerMedia => ({
        id: s.id,
        title: s.name,
        overview: s.overview,
        backdrop_path: s.backdrop_path,
        poster_path: s.poster_path,
        vote_average: s.vote_average,
        resourceType: "tv",
      })
    ),
    ...popular.slice(0, 3).map(
      (s): BannerMedia => ({
        id: s.id,
        title: s.name,
        overview: s.overview,
        backdrop_path: s.backdrop_path,
        poster_path: s.poster_path,
        vote_average: s.vote_average,
        resourceType: "tv",
      })
    ),
  ];

  return (
    <div className="main-page">
      <HeroCarousel items={carouselItems} />

      <section className="section">
        <ShowCarousel title="Trending Now" shows={trending} />
        <ShowCarousel title="Popular" shows={popular} />
        <ShowCarousel title="Top Rated" shows={topRated} />
        <ShowCarousel title="Airing Today" shows={airing} />
      </section>
    </div>
  );
};

export default TvShowsPage;
