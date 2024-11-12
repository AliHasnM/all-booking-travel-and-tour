import { Router } from "express";
import {
  createBooking,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
} from "../controllers/booking.controllers.js";
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);

// Route to create a new booking (e.g., for logged-in users)
router.route("/create-booking").post(checkRole("Passenger"), createBooking);

// Route to get all bookings with optional pagination (e.g., for admin or booking managers)
router
  .route("/all-booking")
  .get(
    checkRole("Passenger", "Admin", "TravelCompany", "Hotel"),
    getAllBookings,
  );

// Route to get a specific booking by ID (e.g., for user or admin)
router
  .route("/one-booking/:bookingId")
  .get(
    checkRole("Passenger", "Admin", "TravelCompany", "Hotel"),
    getBookingById,
  );

// Route to update the status of a booking (e.g., to cancel or complete)
router
  .route("/update-booking/:id/status")
  .patch(checkRole("Admin", "TravelCompany", "Hotel"), updateBookingStatus);

// Route to delete a booking by ID (e.g., for admin)
router
  .route("/delete-booking/:bookingId")
  .delete(checkRole("Admin", "TravelCompany", "Hotel"), deleteBooking);

export default router;