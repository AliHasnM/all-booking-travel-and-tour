// models/booking.model.js

import mongoose, { Schema } from "mongoose";

// Creating the booking schema
const bookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the User (Passenger) model
    },
    serviceType: {
      type: String,
      enum: ["Bus", "Hotel"], // Enum for bus or hotel service types
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      enum: {
        ref: "TravelCompany",
        ref: "Hotel",
      },
      // This could refer to either a route (for bus) or a room (for hotel)
    },
    dateOfBooking: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["confirmed", "canceled"], // Booking status
      default: "confirmed",
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);

// Exporting the Booking model
export const Booking = mongoose.model("Booking", bookingSchema);
