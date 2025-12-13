import { pool } from "../../config/db";

interface CreateBookingPayload {
    customer_id: number;
    vehicle_id: number;
    rent_start_date: string;
    rent_end_date: string;
}

const createBooking = async (payload: CreateBookingPayload) => {

    const { customer_id, vehicle_id, rent_start_date, rent_end_date } = payload;

    // 1. Validate dates:
    const start = new Date(rent_start_date);

    const end = new Date(rent_end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        throw new Error("Invalid rent dates");
    }

    // 2. Check vehicle and availability:
    const vehicleResult = await pool.query(
        `
     SELECT id, vehicle_name, daily_rent_price, availability_status
     FROM vehicles
     WHERE id = $1
     `,
        [vehicle_id]
    );

    if (vehicleResult.rowCount === 0) {
        throw new Error("Vehicle not found");
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.availability_status !== "available") {
        throw new Error("Vehicle is not available");
    }

    // 3. Calculate total_price:
    const msPerDay = 1000 * 60 * 60 * 24;

    const days = Math.ceil((end.getTime() - start.getTime()) / msPerDay);

    const total_price = Number(vehicle.daily_rent_price) * days;

    // 4. Insert booking:
    const bookingResult = await pool.query(
        `
      INSERT INTO bookings (
        customer_id, vehicle_id,
        rent_start_date, rent_end_date,
        total_price, status
      )
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `,
        [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
    );

    // 5. Update vehicle status to "booked":
    await pool.query(
        `
        UPDATE vehicles SET availability_status = 'booked' WHERE id = $1
        `,
        [vehicle_id]
    );

    const booking = bookingResult.rows[0];

    // Add vehicle info to the response:
    return {
        ...booking,
        vehicle: {
            vehicle_name: vehicle.vehicle_name,
            daily_rent_price: vehicle.daily_rent_price
        }
    };
};



const getAllBookings = async () => {

    const result = await pool.query(
        `
        SELECT * FROM bookings
    `);

    return result.rows;
};



const updateBookingStatus = async (bookingId: string, status: "cancelled" | "returned") => {
    const existingResult = await pool.query(
        `
        SELECT * FROM bookings WHERE id = $1
        `,
        [bookingId]
    );

    if (existingResult.rowCount === 0) {
        throw new Error("Booking not found");
    }

    const existing = existingResult.rows[0];

    if (existing.status !== "active") {
        throw new Error("Only active bookings can be updated");
    }

    const updatedResult = await pool.query(
        `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
        [status, bookingId]
    );

    const updated = updatedResult.rows[0];

    // When cancelled or returned ==> vehicle becomes available:
    await pool.query(
        `
        UPDATE vehicles SET availability_status = 'available' WHERE id = $1
        `,
        [updated.vehicle_id]
    );

    return updated;
};

export const bookingService = {
    createBooking,
    getAllBookings,
    updateBookingStatus,
};