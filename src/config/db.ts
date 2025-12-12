import { Pool } from "pg"
import config from "./index";


// Database Pool Setup
export const pool = new Pool({
    connectionString: config.connectionString
})

const initDB = async () => {

    try {
        // Users
        await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(250) NOT NULL UNIQUE,
    password VARCHAR(250) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK (email = LOWER(email))
    )
    `)


        // Vehicles
        await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('car', 'bike', 'van', 'SUV')),
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    daily_rent_price NUMERIC(10, 2) NOT NULL CHECK (daily_rent_price > 0),
    availability_status VARCHAR(20) NOT NULL CHECK (availability_status IN ('available', 'booked'))
    )
    `)


        // Bookings
        await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    rent_start_date TIMESTAMP NOT NULL,
    rent_end_date TIMESTAMP NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'returned')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK (rent_end_date > rent_start_date)
    )
   `)

        console.log("Database initialized successfully!!!");

    } catch (error) {
        console.error("Error initializing database:", error);
    }

}

export default initDB;