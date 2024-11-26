import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  getUserProfile,
  refreshAccessToken,
  changeCurrentPassword,
  adminDashboard,
  travelCompanyDashboard,
  hotelDashboard,
  passengerDashboard,
  addTravelCompany,
  updateTravelCompany,
  getAllTravelCompanies,
  deleteTravelCompany,
  addHotel,
  updateHotel,
  getAllHotel,
  deleteHotel,
  getAllPassenger,
  deletePassenger,
} from "../controllers/user.controllers.js";
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js";

const router = Router();
// router.route("/toggle/v/:videoId").post(toggleVideoLike);
// Register route
router.route("/register").post(checkRole("Admin", "Passenger"), registerUser);

// Login route
router.route("/login").post(loginUser);

// Refresh access token
router.route("/refresh-token").post(refreshAccessToken);

// Change password for authenticated users
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);

// Get and update user profile
router
  .route("/profile")
  .get(checkRole("Admin", "TravelCompany", "Passenger"), getUserProfile);
router.route("/profile-update").patch(updateUserProfile);

// Logout route
router.route("/logout").post(logoutUser);

// Role-based access control routes
router.route("/admin-dashboard").get(checkRole("Admin"), adminDashboard);
router
  .route("/travel-company-dashboard")
  .get(checkRole("TravelCompany"), travelCompanyDashboard);
router.route("/hotel-dashboard").get(checkRole("Hotel"), hotelDashboard);
router
  .route("/passenger-dashboard")
  .get(checkRole("Passenger"), passengerDashboard);

// Admin routes for TravelCompanies
router.route("/addTravelCompany").post(checkRole("Admin"), addTravelCompany);
router
  .route("/getTravelCompanies")
  .get(checkRole("Admin"), getAllTravelCompanies);
router
  .route("/updateTravelCompany/:companyId")
  .patch(checkRole("Admin"), updateTravelCompany);
router
  .route("/deleteTravelCompany/:companyId")
  .delete(checkRole("Admin"), deleteTravelCompany);

// Admin routes for Hotels
router.route("/addHotel").post(checkRole("Admin"), addHotel);
router.route("/getAllHotel").get(checkRole("Admin"), getAllHotel);
router.route("/updateHotel/:hotelId").patch(checkRole("Admin"), updateHotel);
router.route("/deleteHotel/:hotelId").delete(checkRole("Admin"), deleteHotel);

// Admin routes for Passenger
router.route("/getAllPassenger").get(checkRole("Admin"), getAllPassenger);
router
  .route("/deletePassenger/:passengerId")
  .delete(checkRole("Admin"), deletePassenger);
export default router;
