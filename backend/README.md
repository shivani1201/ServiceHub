# ServiceHub — Backend

A REST API built with Node.js, Express, and MongoDB (via Mongoose) that powers
both the customer site and the admin panel.

## MVC architecture

```
backend/
│
├── config/          Database and Cloudinary connection setup
│   ├── db.js
│   └── cloudinary.js
│
├── models/          Mongoose schemas (one file per collection)
│   ├── User.js
│   ├── Provider.js
│   ├── Category.js
│   ├── Service.js
│   ├── Booking.js
│   └── Review.js
│
├── controllers/     Business logic — one file per resource
│   ├── authController.js
│   ├── userController.js
│   ├── providerController.js
│   ├── categoryController.js
│   ├── serviceController.js
│   ├── bookingController.js
│   ├── reviewController.js
│   └── adminController.js
│
├── routes/          Express routers — map HTTP verbs + paths to controllers
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── providerRoutes.js
│   ├── categoryRoutes.js
│   ├── serviceRoutes.js
│   ├── bookingRoutes.js
│   ├── reviewRoutes.js
│   └── adminRoutes.js
│
├── middleware/
│   ├── authMiddleware.js    verifies the JWT, loads req.user, role checks
│   ├── adminMiddleware.js   blocks non-admins
│   ├── upload.js            Multer config for image uploads
│   └── errorMiddleware.js   turns every thrown error into a clean JSON response
│
├── utils/
│   ├── helpers.js   shared helpers: error class, async wrapper, image upload,
│   │                 date/slot math, rating recalculation, etc.
│   └── seed.js       loads demo data (see "Demo data" below)
│
├── server.js         app entry point: middleware, routes, error handling
├── .env.example
└── package.json
```

Nothing is handled directly in `server.js` beyond wiring things together —
every request flows `route → middleware → controller → model`.

## Models

| Model      | Key fields |
|------------|------------|
| `User`     | name, email, password (hashed), phone, profileImage, role (`user` \| `provider` \| `admin`), isActive |
| `Provider` | user (ref), name, email, phone, bio, category (ref), location, experience, rating, isApproved, approvalStatus, availability (days/hours), services (ref[]) |
| `Category` | name, description, image, isActive |
| `Service`  | provider (ref), category (ref), title, description, price, duration, image, isAvailable, rating |
| `Booking`  | user (ref), provider (ref), service (ref), date, time, address, notes, status, price, isReviewed |
| `Review`   | user (ref), provider (ref), service (ref), booking (ref), rating, comment |

`Booking.status` is one of: `pending`, `confirmed`, `completed`, `cancelled`,
`rejected`.

## Authentication

- Passwords are hashed with **bcryptjs** before saving (see the `pre('save')`
  hook on `User`) and are never returned in API responses.
- **JWT** tokens are issued on login/register and must be sent as
  `Authorization: Bearer <token>` on protected routes.
- `middleware/authMiddleware.js` verifies the token and loads the user onto
  `req.user`; `authorizeRoles('provider', 'admin')` restricts a route to
  specific roles, and `middleware/adminMiddleware.js` restricts a route to
  admins only.
- Admins log in through a **separate endpoint**
  (`POST /api/auth/admin-login`) so a customer or provider account can never
  be used to access the admin panel, and vice versa.

## Cloudinary & image uploads

Images (profile photos, provider photos, service photos, category photos) are
uploaded through **Multer** (kept in memory, never written to disk or stored
in MongoDB) and then pushed to **Cloudinary**, which returns a URL that's
saved on the relevant document. Set your Cloudinary credentials in `.env` —
until you do, any upload attempt returns a clear error message instead of
failing silently.

## API endpoints

```
POST   /api/auth/register            Register as a customer or provider
POST   /api/auth/login               Customer / provider login
POST   /api/auth/admin-login         Admin login

GET    /api/users/profile            My profile              (auth)
PUT    /api/users/profile            Update my profile        (auth, multipart)
PUT    /api/users/password           Change my password       (auth)
GET    /api/users                    List users                (admin)
GET    /api/users/:id                User details              (admin)
PUT    /api/users/:id/toggle-active  Activate/deactivate       (admin)
DELETE /api/users/:id                Delete user               (admin)

GET    /api/providers                List approved providers  (public)
GET    /api/providers/:id            Provider profile          (public)
GET    /api/providers/:id/slots      Open time slots for a day (public)
GET    /api/providers/admin/all      List all providers        (admin)
PUT    /api/providers/:id            Edit a provider           (admin)
PUT    /api/providers/:id/approve    Approve a provider        (admin)
PUT    /api/providers/:id/reject     Reject a provider         (admin)
PUT    /api/providers/:id/toggle-active  Activate/deactivate   (admin)
DELETE /api/providers/:id            Delete a provider         (admin)

GET    /api/categories               List active categories   (public)
GET    /api/categories/:id           Category details          (public)
GET    /api/categories/admin/all     List all categories       (admin)
POST   /api/categories               Create category           (admin, multipart)
PUT    /api/categories/:id           Edit category              (admin, multipart)
PUT    /api/categories/:id/toggle-active  Enable/disable        (admin)
DELETE /api/categories/:id           Delete category            (admin)

GET    /api/services                 Search/browse services    (public)
GET    /api/services/:id             Service details            (public)
GET    /api/services/my              My services                (provider)
GET    /api/services/admin/all       List all services          (admin)
POST   /api/services                 Create service             (provider/admin, multipart)
PUT    /api/services/:id             Edit service                (provider/admin, multipart)
PUT    /api/services/:id/toggle      Enable/disable              (provider/admin)
DELETE /api/services/:id             Delete service              (provider/admin)

POST   /api/bookings                 Create a booking           (customer/provider)
GET    /api/bookings/my              My bookings as a customer  (auth)
GET    /api/bookings/provider        Requests I received        (provider)
GET    /api/bookings                 All bookings                (admin)
GET    /api/bookings/:id             Booking details             (auth, owner/provider/admin)
PUT    /api/bookings/:id             Update status                (auth, see rules below)
DELETE /api/bookings/:id             Delete a booking             (admin, or owner if cancelled/rejected)

GET    /api/reviews                  All reviews                 (admin)
GET    /api/reviews/provider/:id     Reviews for a provider      (public)
GET    /api/reviews/service/:id      Reviews for a service       (public)
POST   /api/reviews                  Leave a review               (customer, completed booking only)
DELETE /api/reviews/:id              Remove a review              (author or admin)

GET    /api/admin/dashboard          Stats + chart data            (admin)
```

**Booking status rules:** a customer can only cancel their own `pending` or
`confirmed` booking. A provider can move `pending → confirmed/rejected` and
`confirmed → completed/cancelled`. Admins can set any status.

## Environment variables

See `.env.example` for the full list with comments. You need, at minimum:

```
PORT=5000
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<any long random string>
CLOUDINARY_CLOUD_NAME=<from your Cloudinary dashboard>
CLOUDINARY_API_KEY=<from your Cloudinary dashboard>
CLOUDINARY_API_SECRET=<from your Cloudinary dashboard>
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

## Running the backend

```bash
npm install
cp .env.example .env   # then fill in your values
npm run dev             # starts on http://localhost:5000 with nodemon
```

Load demo data (admin, customers, approved + one pending provider, services,
bookings, and reviews) so the frontend and admin panel have something to show:

```bash
npm run seed              # only runs if the database is currently empty
npm run seed -- --force   # wipes the database first, then loads demo data
npm run seed:destroy      # wipes the database and stops (no demo data)
```
