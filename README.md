# ServiceHub — Frontend (customer site)

The public-facing React app where customers discover services, read reviews,
and book an open time slot. Providers also use this app to manage their own
services and booking requests.

## Purpose

- Browse and search services, filter by category and price, sort by rating
  or price
- View a service's details, provider profile, working hours, and reviews
- Book an open time slot and manage bookings (cancel, review once completed)
- Register as a customer or as a provider; providers get extra pages to
  manage their services and incoming bookings

## Structure

```
frontend/
└── src/
    ├── components/      Reusable, presentational pieces
    │   ├── Navbar/, Footer/, Layout/        page chrome
    │   ├── SearchBar/, CategoryCard/,
    │   │   ServiceCard/, ProviderCard/,
    │   │   BookingCard/                      content cards
    │   ├── Button/, Modal/, Toast/,
    │   │   Loader/, Avatar/, StarRating/,
    │   │   EmptyState/                       general-purpose UI
    │   ├── ReviewModal/                       the "leave a review" dialog
    │   └── ProtectedRoute/                    guards routes behind login
    │
    ├── pages/           One folder per route (each with its own .jsx + .css)
    │   ├── Home/, Services/, ServiceDetails/,
    │   │   ProviderDetails/, Booking/
    │   ├── Login/, Register/
    │   ├── Dashboard/, MyBookings/, MyServices/, Profile/
    │   └── NotFound/
    │
    ├── context/
    │   ├── AuthContext.jsx    current user, login/register/logout, session
    │   └── ToastContext.jsx   toast() notifications used across the app
    │
    ├── services/
    │   └── api.js        every backend call, grouped by resource (authAPI,
    │                       serviceAPI, bookingAPI, etc.) — nothing else in
    │                       the app calls axios directly
    │
    ├── utils/
    │   └── helpers.js    formatting (price, date, time, duration), category
    │                       icons/colors, and a shared getErrorMessage()
    │
    ├── App.jsx           route definitions
    └── main.jsx           app entry point (providers + router)
```

Every component/page follows a `Name/Name.jsx` + `Name/Name.css` pattern —
there's no single giant stylesheet. Shared design tokens (colors, type,
spacing, shadows) live in `src/index.css`.

## Pages and routes

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, categories, top-rated services, providers |
| `/services` | Services | Search, filters, sort, pagination |
| `/services/:id` | ServiceDetails | Full details + reviews + "Book" |
| `/providers/:id` | ProviderDetails | Bio, hours, services, reviews |
| `/book/:serviceId` | Booking | Pick a date/time, address, notes *(auth)* |
| `/login`, `/register` | Login, Register | Customer or provider sign-up |
| `/dashboard` | Dashboard | Different view for customers vs. providers *(auth)* |
| `/my-bookings` | MyBookings | Tabs: upcoming/pending/completed/cancelled *(auth)* |
| `/my-services` | MyServices | Add/edit/enable/disable services *(provider only)* |
| `/profile` | Profile | Edit details, availability, password *(auth)* |

Routes marked *(auth)* redirect to `/login` if you're not signed in, and
remember where you were headed so you land there right after logging in.

## Authentication

Handled by `AuthContext`: on login/register, the API returns a JWT which is
stored in `localStorage` and attached to every API request afterwards by an
Axios interceptor in `services/api.js`. If the token expires, the interceptor
clears the session and the app treats you as logged out.

## API communication

All HTTP calls go through `src/services/api.js`, which wraps Axios and
exposes small, typed-by-convention helpers (`serviceAPI.getAll()`,
`bookingAPI.create()`, and so on). Components never import `axios` directly —
this keeps the base URL, auth header, and error handling in one place.

## Routing

`react-router-dom`, with a shared `Layout` (navbar + footer) wrapping most
pages, and `ProtectedRoute` guarding anything that needs a login (optionally
restricted to a role, e.g. `roles={['provider']}` for `/my-services`).

## Installation

```bash
cd frontend
npm install
```

## Environment variables

Copy `.env.example` to `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_CURRENCY=USD
```

`VITE_API_URL` must point at your running backend. `VITE_CURRENCY` is any ISO
currency code used to format prices throughout the app.

## Run command

```bash
npm run dev
```

Opens on **http://localhost:5173**. Requires the backend to be running (see
`backend/README.md`) — ideally with demo data loaded via `npm run seed` in
`backend/`, so there's something to browse right away.
