// models/reminder.model.js

import mongoose, { Schema } from "mongoose";

// Creating the reminder schema
const reminderSchema = new Schema(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route", // Reference to the Route model
    },
    travelCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "TravelCompany", // Reference to the TravelCompany model
    },
    passengers: [
      {
        passengerId: {
          type: Schema.Types.ObjectId,
          ref: "Passenger", // Reference to the Passenger model
        },
        email: {
          type: String,
          required: true,
        },
        phoneNumber: {
          type: String,
          required: true,
        },
      },
    ],
    reminderMessage: {
      type: String,
      required: true,
    },
    reminderDate: {
      type: Date,
      required: true, // Date when the reminder will be sent
    },
    reminderStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending", // Default status is pending
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);

// Exporting the Reminder model
export const Reminder = mongoose.model("Reminder", reminderSchema);
