import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";

export interface ShowTracking {
  id: number;
  title: string;
  posterPath: string;
  currentSeason: number;
  currentEpisode: number;
  totalEpisodes: number;
  nextAirDate: string | null; // ISO date for next episode
}

type Action =
  | { type: "ADD_SHOW"; payload: ShowTracking }
  | { type: "REMOVE_SHOW"; payload: number }
  | {
      type: "UPDATE_PROGRESS";
      payload: {
        id: number;
        season: number;
        episode: number;
        nextAirDate: string | null;
      };
    }
  | { type: "INIT"; payload: ShowTracking[] };

function reducer(state: ShowTracking[], action: Action): ShowTracking[] {
  switch (action.type) {
    case "INIT":
      return action.payload;
    case "ADD_SHOW":
      return [...state, action.payload];
    case "REMOVE_SHOW":
      return state.filter((s) => s.id !== action.payload);
    case "UPDATE_PROGRESS":
      return state.map((s) =>
        s.id === action.payload.id
          ? {
              ...s,
              currentSeason: action.payload.season,
              currentEpisode: action.payload.episode,
              nextAirDate: action.payload.nextAirDate,
            }
          : s
      );
    default:
      return state;
  }
}

const TrackingContext = createContext<{
  tracked: ShowTracking[];
  addShow: (show: ShowTracking) => void;
  removeShow: (id: number) => void;
  updateProgress: (
    id: number,
    season: number,
    episode: number,
    nextAirDate: string | null
  ) => void;
} | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [tracked, dispatch] = useReducer(reducer, []);

  // Persist to localStorage
  useEffect(() => {
    const stored = localStorage.getItem("trackedShows");
    if (stored) dispatch({ type: "INIT", payload: JSON.parse(stored) });
  }, []);

  useEffect(() => {
    localStorage.setItem("trackedShows", JSON.stringify(tracked));
  }, [tracked]);

  const addShow = (show: ShowTracking) =>
    dispatch({ type: "ADD_SHOW", payload: show });
  const removeShow = (id: number) =>
    dispatch({ type: "REMOVE_SHOW", payload: id });
  const updateProgress = (
    id: number,
    season: number,
    episode: number,
    nextAirDate: string | null
  ) =>
    dispatch({
      type: "UPDATE_PROGRESS",
      payload: { id, season, episode, nextAirDate },
    });

  return (
    <TrackingContext.Provider
      value={{ tracked, addShow, removeShow, updateProgress }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error("useTracking must be used within TrackingProvider");
  return ctx;
}
