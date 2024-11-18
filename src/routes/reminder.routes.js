import { Router } from "express";
import {
  createReminder,
  getAllReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  sendReminders,
} from "../controllers/reminder.controllers.js";
import { verifyJWT, checkRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware for authenticated routes
router.use(verifyJWT);
// Create a new Reminder
router
  .route("/create-reminder-travelComapany/:travelCompanyId/:routeId")
  .post(checkRole("TravelCompany"), createReminder);

// Get all Reminders with optional pagination
router.route("/all-reminders").get(checkRole("TravelCompany"), getAllReminders);

// Get a specific Reminder by ID
router
  .route("/reminder/:reminderId")
  .get(checkRole("TravelCompany"), getReminderById);

// Update Reminder details
router
  .route("/update-reminder/:reminderId")
  .patch(checkRole("TravelCompany"), updateReminder);

// Delete a Reminder
router
  .route("/delete-reminder/:reminderId")
  .delete(checkRole("TravelCompany"), deleteReminder);

// Send reminders to passengers (explicit action)
router.route("/send-reminders").post(checkRole("TravelCompany"), sendReminders);

export default router;
