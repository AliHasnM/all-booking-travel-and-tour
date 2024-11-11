// models/travelCompany.model.js

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Creating the travel company schema
const travelCompanySchema = new Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Ensures no extra spaces in the name
    },
    routes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Route", // Referencing the Route model
      },
    ],
    contactInfo: {
      email: {
        type: String,
        required: true,
        unique: true, // Ensures no duplicate email
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], // Simple email validation regex
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    rating: {
      type: Number,
      default: 0, // Default rating is 0
      min: 0, // Rating cannot be less than 0
      max: 5, // Rating cannot be more than 5
    },
    profileImage: {
      type: String, // URL for the profile image (if required)
      required: true,
    },
    description: {
      type: String, // Short description of the company
      required: true,
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);

// Adding pagination functionality using mongoose-aggregate-paginate-v2
travelCompanySchema.plugin(mongooseAggregatePaginate);

// Exporting the Travel Company model
export const TravelCompany = mongoose.model(
  "TravelCompany",
  travelCompanySchema,
);
