import { Request, Response } from "express";
import { bookingService } from "./bookings.service";


const createBooking = async (req: Request, res: Response) => {

    try {
        const booking = await bookingService.createBooking(req.body);

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
        const bookings = await bookingService.getAllBookings();

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: bookings,
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const updateBooking = async (req: Request, res: Response) => {

    const { bookingId } = req.params;
    const { status } = req.body as { status?: string };

    try {
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
            });
        }

        if (status !== "cancelled" && status !== "returned") {
            return res.status(400).json({
                success: false,
                message: "Status must be either 'cancelled' or 'returned'",
            });
        }

        const updated = await bookingService.updateBookingStatus(
            bookingId!,
            status as "cancelled" | "returned"
        );

        const message =
            status === "cancelled"
                ? "Booking cancelled successfully"
                : "Booking marked as returned. Vehicle is now available";

        res.status(200).json({
            success: true,
            message,
            data: updated,
        });

    } catch (error: any) {
        if (error.message === "Booking not found") {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


export const bookingController = {
    createBooking,
    getAllBookings,
    updateBooking,
};