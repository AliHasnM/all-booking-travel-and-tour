import { Router } from "express";
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
} from "../controllers/routeCompany.controllers.js";
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);

// Create a new Route
router
  .route("/create-route/:companyId")
  .post(checkRole("TravelCompany"), createRoute);

// Get all Routes with optional pagination
router
  .route("/all-routes")
  .get(checkRole("TravelCompany", "Passenger"), getAllRoutes);

// Get a specific Route by ID
router
  .route("/route/:routeId")
  .get(checkRole("TravelCompany", "Passenger"), getRouteById);

router
  .route("/update-route/:routeId")
  .patch(checkRole("TravelCompany"), updateRoute);

// Delete a Route
router
  .route("/delete-route/:routeId")
  .delete(checkRole("TravelCompany"), deleteRoute);

export default router;
