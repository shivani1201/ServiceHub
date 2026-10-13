# ServiceHub — Admin Panel

A separate React app where admins review providers, manage the service
catalog, and keep an eye on the platform. It talks to the same backend API as
the customer site, just with an admin-only token.

## Purpose

Everything a ServiceHub admin needs in one place: approve or reject new
providers, manage users, services, categories, bookings, and reviews, and
check platform health on a stats + charts dashboard.

## Admin authentication

Admins sign in through a dedicated endpoint
(`POST /api/auth/admin-login`) that only succeeds for accounts with the
`admin` role — a customer or provider login will never work here, and an
admin login won't work on the customer site. The session (JWT + user) is
stored under its own `localStorage` keys (`servicehub_admin_token` /
`servicehub_admin_user`), completely separate from the customer site's
session, so you can be logged into both at once in the same browser if you
want to.

`ProtectedRoute` guards every page except `/login`; `AdminLayout` (sidebar +
topbar) wraps every page once you're signed in.

## Dashboard

Shows, at a glance: total users, total providers, total services, total
bookings, pending providers, and completed bookings — plus four simple
charts (via Recharts): bookings over the last 6 months, new users over the
last 6 months, the most popular services by booking count, and a breakdown
of bookings by status. A short list of the most recent bookings sits below.

## User management

View every account (customers, providers, admins), search by name or email,
filter by role, open a user's details (bookings made, reviews written, and
— for providers — their category and approval status), activate/deactivate,
or delete. Admin accounts can't be deactivated or deleted from here.

## Provider management

Filter by approval status (pending/approved/rejected), approve or reject a
provider with one click, edit their details, activate/deactivate them, or
delete them entirely (which also removes their services, bookings, and
reviews).

## Service management

Every service across every provider, in one table. Add a new service on
behalf of any approved provider, edit an existing one, enable/disable it, or
delete it.

## Category management

Add, edit, enable/disable, or delete the categories services are grouped
under. A category in use by a service or provider can't be deleted — disable
it instead to hide it from the public site.

## Booking management

Filter bookings by status, open any booking to see full details (customer,
provider, service, date/time, address, notes), and change its status
directly — useful for stepping in on a dispute or a stuck request.

## Review management

See every review platform-wide and remove ones that violate guidelines.
Removing a review automatically recalculates the affected provider's and
service's average rating.

## API communication

All calls go through `src/services/api.js`, the same pattern as the frontend:
a small, resource-grouped wrapper around Axios (`userAPI`, `providerAPI`,
`serviceAPI`, `categoryAPI`, `bookingAPI`, `reviewAPI`, `dashboardAPI`) with
an interceptor that attaches the admin's token and clears the session if it
expires.

## Installation

```bash
cd admin
npm install
```

## Environment variables

Copy `.env.example` to `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_CURRENCY=USD
```

Same two variables as the frontend — `VITE_API_URL` must point at your
running backend.

## Run command

```bash
npm run dev
```

Opens on **http://localhost:5174** (the customer site uses 5173, so both can
run side by side). Requires the backend to be running. After seeding the
backend (`npm run seed` in `backend/`), log in with:

```
admin@servicehub.com / Admin@123
```
