import { Router } from "express";
import {
  createRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
  getAllRooms,
} from "../controllers/roomHotel.controllers.js";
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);

// Route to create a new room (accessible only to TravelCompany role)
router.route("/create-room/:hotelId").post(checkRole("Hotel"), createRoom);

// Route to get all rooms with optional pagination
router.route("/all-rooms").get(checkRole("Hotel"), getAllRooms);

// Route to get a specific room by ID
router.route("/room/:roomId").get(checkRole("Hotel"), getRoomById);

// Route to update room details by ID
router.route("/update-room/:roomId").patch(checkRole("Hotel"), updateRoom);

// Route to delete a room by ID
router.route("/delete-room/:roomId").delete(checkRole("Hotel"), deleteRoom);

export default router;
