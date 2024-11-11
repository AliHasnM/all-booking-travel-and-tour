// models/route.model.js

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Creating the route schema
const routeSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "TravelCompany", // Reference to the TravelCompany model
      required: true,
    },
    departure: {
      location: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      time: {
        type: String, // Store time in "HH:mm" format (can be improved)
        required: true,
      },
    },
    arrival: {
      location: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      time: {
        type: String, // Store time in "HH:mm" format
        required: true,
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Price cannot be negative
    },
    seats: [
      {
        seatNumber: {
          type: String, // Example: "1A", "2B", etc.
          required: true,
        },
        availability: {
          type: Boolean,
          default: true, // True if the seat is available
        },
      },
    ],
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);

// Adding pagination functionality using mongoose-aggregate-paginate-v2
routeSchema.plugin(mongooseAggregatePaginate);

// Exporting the Route model
export const Route = mongoose.model("Route", routeSchema);
