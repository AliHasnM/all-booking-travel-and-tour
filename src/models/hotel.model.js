// models/hotel.model.js

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Creating the hotel schema
const hotelSchema = new Schema(
  {
    hotelName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    rooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Room", // Reference to the Room model
      },
    ],
    contactInfo: {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    // Additional fields (optional)
    amenities: {
      type: [String], // Array of amenities available at the hotel (e.g., WiFi, Pool, Gym, etc.)
      required: true,
    },
    hotelProfile: {
      type: String, // URL to hotel profile image or additional information
      required: true,
    },
    priceRange: {
      type: String, // Example: "Low", "Mid", "High"
    },
    checkInTime: {
      type: String, // Example: "14:00"
      required: true,
    },
    checkOutTime: {
      type: String, // Example: "12:00"
      required: true,
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);

// Adding pagination functionality using mongoose-aggregate-paginate-v2
hotelSchema.plugin(mongooseAggregatePaginate);

// Exporting the Hotel model
export const Hotel = mongoose.model("Hotel", hotelSchema);
