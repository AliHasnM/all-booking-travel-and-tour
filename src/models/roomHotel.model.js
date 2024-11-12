// models/room.model.js

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Creating the room schema
const roomSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: "Hotel", // Reference to the Hotel model
      required: true,
    },
    type: {
      type: String,
      enum: ["single", "double", "suite"], // Enum for room types
      required: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0, // Price should be non-negative
    },
    availability: {
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
        required: true,
      },
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);

roomSchema.plugin(mongooseAggregatePaginate);

// Exporting the Room model
export const Room = mongoose.model("Room", roomSchema);
