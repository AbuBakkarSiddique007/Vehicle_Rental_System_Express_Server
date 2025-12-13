import { Router } from "express";
import { bookingController } from "./bookings.controller";

const router = Router();


router.post("/", bookingController.createBooking);
router.get("/", bookingController.getAllBookings);
router.put("/:bookingId", bookingController.updateBooking);

export const bookingRoute = router;