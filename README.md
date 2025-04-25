# TrackIt

A full-stack movie & TV tracking application built with React, TypeScript, Material-UI on the front-end and NestJS, TypeORM, and PostgreSQL on the back-end. Powered by the TMDB API for content discovery, with user authentication (JWT), per-user watchlists, half-point ratings, and detailed movie pages.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Movies](#movies)
  - [Watchlist](#watchlist)
  - [Ratings](#ratings)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **User Authentication (JWT):** Signup, login, logout, and protected routes.
- **Global State & UX:**
  - Full-page loading overlay & top progress bar (Axios interceptors).
  - MUI Skeleton placeholders.
  - Snackbar notifications for success/errors.
- **Discover Movies:**
  - Trending, Popular, Top-Rated & Upcoming carousels with hero banner.
  - Responsive, infinite-scroll carousels (slick).
- **Movie Details:**
  - Full backdrop banner, runtime, release year, genres, language.
  - TMDB score + half-point user rating (1–10).
  - Add/remove to Watchlist.
  - Play YouTube trailer in a modal.
  - Top cast preview + “See All” cast dialog.
- **Cast & Crew Page:**
  - Full listing grouped by department (Directing, Writing, etc.)
  - Card layout with overflow-ellipsis + tooltip for long names.
- **User Menu:**
  - Avatar dropdown with links to Profile, My Watchlist, My Ratings, Logout.
- **Persistent Watchlist & Ratings:**
  - Stored in PostgreSQL via TypeORM, per-user unique constraints.
- **Modular Design:**
  - Custom React Contexts for Auth, Loading, Notifications.
  - Clean separation of layouts (public vs. app).

---

## Tech Stack

| Front-End                      | Back-End                  | Dev & Infra         |
| ------------------------------ | ------------------------- | ------------------- |
| React 18, TypeScript, Vite/CRA | NestJS, TypeScript        | PostgreSQL, TypeORM |
| Material-UI v5                 | Passport-JWT, @nestjs/jwt | Docker (optional)   |
| react-router v6, axios         | class-validator, Joi      | ESLint, Prettier    |
| react-slick (Slick carousel)   | dotenv, ConfigModule      | Git, GitHub Actions |
| jwt-decode                     | helmet, cookie-parser     |                     |

---

## Architecture & Folder Structure

```
frontend/
├─ src/
│  ├─ components/         # Reusable UI components (Header, Footer, UserMenu, FullPageLoader, Snackbars…)
│  ├─ contexts/           # React Contexts (Auth, Loading, Notifications)
│  ├─ layout/             # PublicLayout & AppLayout wrappers
│  ├─ pages/              # Route components (Login, SignUp, MainPage, MovieDetails, MovieCredits, Static pages…)
│  ├─ router.tsx          # React-Router configuration
│  ├─ index.tsx           # App entry
│  └─ index.css           # Global styles
├─ package.json
└─ tsconfig.json

backend/
├─ src/
│  ├─ auth/               # Auth module, service, controller, strategy
│  ├─ movies/             # MoviesController & MoviesService (TMDB integration)
│  ├─ watchlist/          # WatchlistController & Service & Entity
│  ├─ ratings/            # RatingsController & Service & Entity
│  ├─ user/               # UserModule, UserService, UserController, DTOs, Entity
│  ├─ database/           # TypeORM DataSource setup
│  ├─ app.module.ts
│  └─ main.ts             # NestJS bootstrap
├─ package.json
└─ tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 16.x
- npm or Yarn
- PostgreSQL server

### Environment Variables

Create a `.env` in **backend/**:

```dotenv
PORT=4000
TMDB_API_KEY=your_tmdb_api_key
JWT_SECRET=your_jwt_secret
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_pass
POSTGRES_DATABASE=trackit
RUN_MIGRATIONS=true
DBLOGGING=false
DBSYNC=true
```

And in **frontend/** (for CRA/Vite):

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### Database Setup

1. Create the database:
   ```bash
   psql -U your_db_user -c "CREATE DATABASE trackit;"
   ```
2. If using **synchronize**, Nest will auto-sync tables on startup; otherwise run migrations.

### Running Locally

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev  # or npm start for CRA
```

Open your browser to `http://localhost:3000`.

---

## API Reference

### Authentication

| Endpoint       | Method | Body                            | Response                 |
| -------------- | ------ | ------------------------------- | ------------------------ |
| `/auth/signup` | POST   | `{ username, email, password }` | `{ user, access_token }` |
| `/auth/login`  | POST   | `{ email, password }`           | `{ user, access_token }` |

### Movies

| Endpoint               | Method | Description            |
| ---------------------- | ------ | ---------------------- |
| `/movies/trending`     | GET    | Trending movies (week) |
| `/movies/popular`      | GET    | Popular movies         |
| `/movies/top-rated`    | GET    | Top-rated movies       |
| `/movies/upcoming`     | GET    | Upcoming releases      |
| `/movies/:id`          | GET    | Movie details          |
| `/movies/:id/credits`  | GET    | Cast & crew            |
| `/movies/:id/videos`   | GET    | Trailers & videos      |
| `/movies?q=searchTerm` | GET    | Search movies by query |

### Watchlist _(Protected)_

| Endpoint              | Method | Description                          |
| --------------------- | ------ | ------------------------------------ |
| `/watchlist`          | GET    | Get current user’s watchlist         |
| `/watchlist/:movieId` | POST   | Add a movie (body: `{ movieTitle }`) |
| `/watchlist/:movieId` | DELETE | Remove a movie                       |

### Ratings _(Protected)_

| Endpoint            | Method | Body                | Description              |
| ------------------- | ------ | ------------------- | ------------------------ |
| `/ratings`          | GET    |                     | List all user's ratings  |
| `/ratings/:movieId` | GET    |                     | Get rating for a movie   |
| `/ratings/:movieId` | POST   | `{ score: number }` | Set/update rating (1–10) |

---

## Scripts

- **Frontend**
  - `npm run dev` / `npm start` — Start dev server
  - `npm run build` — Build production
  - `npm run lint` — Lint code
- **Backend**
  - `npm run start:dev` — NestJS dev mode
  - `npm run build` — Compile
  - `npm run start:prod` — Run compiled

---

## Deployment

Use Docker Compose or CI/CD pipelines to deploy both services and the database.

---

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feat/your-feature`)
3. Commit your changes
4. Run tests & lint
5. Open a Pull Request

---

## License

Palaghita Octavian
UNSTPB
