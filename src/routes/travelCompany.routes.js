import { Router } from "express";
import {
  createTravelCompany,
  getAllTravelCompanies,
  getTravelCompanyById,
  updateTravelCompany,
  deleteTravelCompany,
} from "../controllers/travelCompany.controllers.js";
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);

// Create a new Travel Company
router
  .route("/create-comapny")
  .post(
    checkRole("TravelCompany"),
    upload.fields([{ name: "profileImage", maxCount: 1 }]),
    createTravelCompany,
  );

// Get all Travel Companies with pagination
router
  .route("/all-companies")
  .get(checkRole("TravelCompany"), getAllTravelCompanies);

// Get a Travel Company by ID
router
  .route("/comapny/:companyId")
  .get(checkRole("TravelCompany"), getTravelCompanyById);

// Update Travel Company details
router
  .route("/update-comapny/:companyId")
  .patch(
    checkRole("TravelCompany"),
    upload.fields([{ name: "profileImage", maxCount: 1 }]),
    updateTravelCompany,
  );

// Delete a Travel Company
router
  .route("/delete-company/:companyId")
  .delete(checkRole("TravelCompany"), deleteTravelCompany);

export default router;
