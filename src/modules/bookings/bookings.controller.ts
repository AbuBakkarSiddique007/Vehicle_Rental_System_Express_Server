import { Request, Response } from "express";
import { bookingService } from "./bookings.service";


const createBooking = async (req: Request, res: Response) => {

    try {
        const requested = (req as any).user;

        if (!requested) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { vehicle_id, rent_start_date, rent_end_date } = req.body || {};

        if (!vehicle_id || !rent_start_date || !rent_end_date) {
            return res.status(400).json({
                success: false,
                message: "vehicle_id, rent_start_date and rent_end_date are required"
            });
        }

        const payload = { ...req.body };

        if (requested.role === "customer") {
            payload.customer_id = requested.id;
        }

        const booking = await bookingService.createBooking(payload as any);

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });

    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};


const getAllBookings = async (req: Request, res: Response) => {

    try {
        const requested = (req as any).user;

        if (!requested) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (requested.role === "admin") {
            const adminBookings = await bookingService.getAllBookings();
            return res.status(200).json({
                success: true,
                message: "Bookings retrieved successfully",
                data: adminBookings
            });
        }

        // customer: only own bookings
        const customerBookings = await bookingService.getBookingsByCustomerId(requested.id);

        res.status(200).json({
            success: true,
            message: "Your bookings retrieved successfully",
            data: customerBookings
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const updateBooking = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body as { status?: string };
        const requested = (req as any).user;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const bookingResult = await bookingService.getBookingById(bookingId!);

        if (!bookingResult) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (!requested) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Customer cancelling:
        if (requested.role === "customer") {
            if (status !== "cancelled") {
                return res.status(403).json({
                    success: false,
                    message: "Customers can only cancel bookings"
                });
            }

            if (String(bookingResult.customer_id) !== String(requested.id)) {
                return res.status(403).json({
                    success: false,
                    message: "You can cancel only your bookings"
                });
            }

            const now = new Date();
            if (!bookingResult.rent_start_date) {
                return res.status(500).json({
                    success: false,
                    message: "Booking has invalid start date"
                });
            }

            const start = new Date(bookingResult.rent_start_date);
            if (now >= start) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot cancel booking on/after start date"
                });
            }

            const updated = await bookingService.updateBookingStatus(bookingId!, "cancelled");

            return res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                data: updated
            });
        }

        // Admin marking as returned:
        if (requested.role === "admin") {
            if (status !== "returned") {
                return res.status(403).json({ success: false, message: "Admin may only mark returned here" });
            }

            const updated = await bookingService.updateBookingStatus(bookingId!, "returned");

            return res.status(200).json({
                success: true,
                message: "Booking marked as returned",
                data: updated
            });
        }

        res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};


export const bookingController = {
    createBooking,
    getAllBookings,
    updateBooking,
};