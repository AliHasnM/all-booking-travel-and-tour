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
} from "../controllers/user.controllers.js";
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js";

const router = Router();
// router.route("/toggle/v/:videoId").post(toggleVideoLike);
// Register route
router.route("/register").post(registerUser);

// Login route
router.route("/login").post(loginUser);

// Refresh access token
router.route("/refresh-token").post(refreshAccessToken);

// Change password for authenticated users
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);

// Get and update user profile
router.route("/profile").get(getUserProfile);
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

export default router;
