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
            RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status
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

    return {
        ...booking,
        vehicle: {
            vehicle_name: vehicle.vehicle_name,
            daily_rent_price: vehicle.daily_rent_price
        }
    };
};



const getAllBookings = async () => {

    const bookingsResult = await pool.query(
        `
        SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings ORDER BY id
        `
    );

    const bookings = bookingsResult.rows;
    if (!bookings || bookings.length === 0) return [];


    const uniqueCustomerIds = Array.from(new Set(bookings.map((bk: any) => bk.customer_id)));
    const uniqueVehicleIds = Array.from(new Set(bookings.map((bk: any) => bk.vehicle_id)));


    const usersResult = await pool.query(`
        SELECT id, name, email FROM users WHERE id = ANY($1::int[])
        `, [uniqueCustomerIds]);

    const vehiclesResult = await pool.query(
        `
        SELECT id, vehicle_name, registration_number, type FROM vehicles WHERE id = ANY($1::int[])`, [uniqueVehicleIds]);

    const usersById = new Map(usersResult.rows.map((u: any) => [u.id, u]));
    const vehiclesById = new Map(vehiclesResult.rows.map((v: any) => [v.id, v]));


    return bookings.map((bk: any) => ({
        id: bk.id,
        customer_id: bk.customer_id,
        vehicle_id: bk.vehicle_id,
        rent_start_date: new Date(bk.rent_start_date).toISOString().split('T')[0],
        rent_end_date: new Date(bk.rent_end_date).toISOString().split('T')[0],
        total_price: Number(bk.total_price),
        status: bk.status,
        customer: (() => {
            const u = usersById.get(bk.customer_id);
            return u ? { name: u.name, email: u.email } : null;
        })(),
        vehicle: (() => {
            const v = vehiclesById.get(bk.vehicle_id);
            return v ? { vehicle_name: v.vehicle_name, registration_number: v.registration_number } : null;
        })(),
    }));
};


const getBookingById = async (bookingId: string) => {
    const bookingResult = await pool.query(
        `SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings WHERE id = $1`,
        [bookingId]
    );
    if (bookingResult.rowCount === 0) return null;

    const booking = bookingResult.rows[0];

    const userResult = await pool.query(`SELECT id, name, email FROM users WHERE id = $1`, [booking.customer_id]);
    const vehicleResult = await pool.query(`SELECT id, vehicle_name, registration_number, type FROM vehicles WHERE id = $1`, [booking.vehicle_id]);

    const user = userResult.rowCount ? userResult.rows[0] : null;
    const vehicle = vehicleResult.rowCount ? vehicleResult.rows[0] : null;

    return {
        id: booking.id,
        customer_id: booking.customer_id,
        vehicle_id: booking.vehicle_id,
        rent_start_date: new Date(booking.rent_start_date).toISOString().split('T')[0],
        rent_end_date: new Date(booking.rent_end_date).toISOString().split('T')[0],
        total_price: Number(booking.total_price),
        status: booking.status,
        customer: user ? { name: user.name, email: user.email } : null,
        vehicle: vehicle ? { vehicle_name: vehicle.vehicle_name, registration_number: vehicle.registration_number, type: vehicle.type } : null,
    };
};

const getBookingsByCustomerId = async (customerId: string | number) => {
    const bookingsResult = await pool.query(
        `SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings WHERE customer_id = $1 ORDER BY id`,
        [customerId]
    );

    const bookings = bookingsResult.rows;
    if (!bookings || bookings.length === 0) return [];

    const uniqueVehicleIds = Array.from(new Set(bookings.map((bk: any) => bk.vehicle_id)));
    const vehiclesResult = await pool.query(`SELECT id, vehicle_name, registration_number, type FROM vehicles WHERE id = ANY($1::int[])`, [uniqueVehicleIds]);
    const vehiclesById = new Map(vehiclesResult.rows.map((v: any) => [v.id, v]));

    return bookings.map((bk: any) => ({
        id: bk.id,
        vehicle_id: bk.vehicle_id,
        rent_start_date: new Date(bk.rent_start_date).toISOString().split('T')[0],
        rent_end_date: new Date(bk.rent_end_date).toISOString().split('T')[0],
        total_price: Number(bk.total_price),
        status: bk.status,
        vehicle: (() => {
            const v = vehiclesById.get(bk.vehicle_id);
            return v ? { vehicle_name: v.vehicle_name, registration_number: v.registration_number, type: v.type } : null;
        })(),
    }));
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
        `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
        [status, bookingId]
    );

    const updated = updatedResult.rows[0];

    const vehicleId = updated.vehicle_id;

    const activeForVehicle = await pool.query(
        `SELECT 1 FROM bookings WHERE vehicle_id = $1 AND status = 'active' LIMIT 1`,
        [vehicleId]
    );

    let vehicleBecameAvailable = false;
    if (activeForVehicle.rowCount === 0) {
        await pool.query(`UPDATE vehicles SET availability_status = 'available' WHERE id = $1`, [vehicleId]);
        vehicleBecameAvailable = true;
    }

    const formatted = {
        id: updated.id,
        customer_id: updated.customer_id,
        vehicle_id: updated.vehicle_id,
        rent_start_date: new Date(updated.rent_start_date).toISOString().split('T')[0],
        rent_end_date: new Date(updated.rent_end_date).toISOString().split('T')[0],
        total_price: Number(updated.total_price),
        status: updated.status,
    } as any;

    if (status === 'returned' && vehicleBecameAvailable) {
        formatted.vehicle = { availability_status: 'available' };
    }

    return formatted;
};

export const bookingService = {
    createBooking,
    getAllBookings,
    getBookingById,
    getBookingsByCustomerId,
    updateBookingStatus,
};