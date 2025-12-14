import { Router } from "express";
import { bookingController } from "./bookings.controller";
import auth from "../../middlewares/auth";

const router = Router();


router.post("/", auth(), bookingController.createBooking);
router.get("/", auth(), bookingController.getAllBookings);
router.put("/:bookingId", auth(), bookingController.updateBooking);

export const bookingRoute = router;