import { checkRole } from "../middlewares/auth.middleware.js";
import { Reminder } from "../models/reminder.model.js";
import { Route } from "../models/routeCompnay.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new Reminder
const createReminder = asyncHandler(async (req, res) => {
  const { reminderMessage, reminderDate, passengers } = req.body;
  const { routeId, travelCompanyId } = req.params; // routeId and travelCompanyId from req.params

  // Validate required fields
  if (
    !routeId ||
    !travelCompanyId ||
    !reminderMessage ||
    !reminderDate ||
    !passengers
  ) {
    throw new ApiError(
      400,
      "All fields (reminderMessage, reminderDate, passengers) are required",
    );
  }

  // Validate Route and TravelCompany existence
  await checkRole(Route, routeId, "Route");
  await checkRole(Reminder, travelCompanyId, "Travel Company");

  // Ensure passengers array contains passengerId, email, and phoneNumber
  const validPassengers = passengers.map((passenger) => {
    if (!passenger.email || !passenger.phoneNumber) {
      throw new ApiError(
        400,
        "Passenger data is incomplete or missing passengerId",
      );
    }
    return {
      email: passenger.email,
      phoneNumber: passenger.phoneNumber,
    };
  });

  // Create a new Reminder
  const reminder = await Reminder.create({
    routeId,
    travelCompanyId,
    passengers: validPassengers, // Array of passengers
    reminderMessage,
    reminderDate,
  });

  // Return the created reminder
  res
    .status(201)
    .json(new ApiResponse(201, reminder, "Reminder created successfully"));
});

// Get all Reminders
const getAllReminders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const reminders = await Reminder.aggregate([
    { $match: {} }, // Match all reminders (add conditions if necessary)
    { $skip: (page - 1) * limit }, // Skip based on the page number
    { $limit: parseInt(limit) }, // Limit results
  ]).option({ allowDiskUse: true });

  const totalReminders = await Reminder.countDocuments();

  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(totalReminders / limit),
    totalReminders,
  };

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reminders, pagination },
        "Reminders retrieved successfully",
      ),
    );
});

// Get a specific Reminder by ID
const getReminderById = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.reminderId).populate(
    "routeId travelCompanyId",
  );

  if (!reminder) {
    throw new ApiError(404, "Reminder not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, reminder, "Reminder retrieved successfully"));
});

// Update a Reminder
const updateReminder = asyncHandler(async (req, res) => {
  const updatedReminder = await Reminder.findByIdAndUpdate(
    req.params.reminderId,
    req.body,
    { new: true },
  );

  if (!updatedReminder) {
    throw new ApiError(404, "Reminder not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedReminder, "Reminder updated successfully"),
    );
});

// Delete a Reminder
const deleteReminder = asyncHandler(async (req, res) => {
  const deletedReminder = await Reminder.findByIdAndDelete(
    req.params.reminderId,
  );

  if (!deletedReminder) {
    throw new ApiError(404, "Reminder not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Reminder deleted successfully"));
});

// Send Reminders (to all passengers on a route)
const sendReminders = asyncHandler(async (req, res) => {
  const { routeId } = req.body;

  // Validate route ID
  if (!routeId) {
    throw new ApiError(400, "Route ID is required");
  }

  // Find passengers for the route
  const route = await Route.findById(routeId).populate("seats.passengerId");
  if (!route) {
    throw new ApiError(404, "Route not found");
  }

  const passengers = route.seats
    .filter((seat) => seat.availability === false)
    .map((seat) => seat.passengerId);

  // Simulate sending reminders (actual implementation would use an email/SMS service)
  passengers.forEach((passenger) => {
    console.log(`Reminder sent to passenger: ${passenger.email}`);
    // Add actual email/SMS service logic here
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Reminders sent to all passengers successfully",
      ),
    );
});

export {
  createReminder,
  getAllReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  sendReminders,
};
