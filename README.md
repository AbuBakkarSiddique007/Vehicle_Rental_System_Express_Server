# Vehicle Rental System

A lightweight backend API for managing vehicle inventory, customer accounts, and rental bookings. It provides secure, role-based access for admins and customers and includes booking lifecycle handling (create, cancel, return).

Live URL: [Server Link](https://assignment-02-lake.vercel.app) 

## Features

- User registration and login (JWT)
- Role-based authorization (`admin`, `customer`)
- Vehicle inventory management (admin CRUD)
- Bookings: create, view, cancel (customer), mark returned (admin)

## Technology Stack

- Node.js, TypeScript
- Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- bcrypt (`bcryptjs`)

## Setup & Usage Instructions

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file with the following variables:

```
CONNECTION_STRING=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_jwt_secret
PORT=5000
```

3. Start the app (development):

```bash
npm run dev
```

4. Base API URL: `http://localhost:5000/api/v1`

5. Basic request flow:

- Register or sign in user: `POST /api/v1/auth/signin` → receive JWT
- Use header for protected endpoints:

```
Authorization: Bearer <token>
```
