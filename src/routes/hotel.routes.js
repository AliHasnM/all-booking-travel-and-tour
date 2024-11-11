import { Router } from "express";
import {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
} from "../controllers/hotel.controllers.js"; // Assuming you have controllers for each action
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js"; // Adjust middleware as necessary
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);

// Create a new Hotel
router.route("/create-hotel").post(
  checkRole("Hotel"), // Assuming "HotelManager" role for adding hotels
  upload.fields([{ name: "hotelProfile", maxCount: 1 }]), // Optional: add file upload if necessary
  createHotel,
);

// Get all Hotels with pagination
router.route("/all-hotels").get(checkRole("Hotel"), getAllHotels);

// Get a Hotel by ID
router.route("/hotel/:hotelId").get(checkRole("Hotel"), getHotelById);

// Update Hotel details
router.route("/update-hotel/:hotelId").patch(
  checkRole("Hotel"), // Assuming "HotelManager" role for updating hotels
  upload.fields([{ name: "hotelProfile", maxCount: 1 }]), // Optional: add file upload if necessary
  updateHotel,
);

// Delete a Hotel
router.route("/delete-hotel/:hotelId").delete(checkRole("Hotel"), deleteHotel);

export default router;
