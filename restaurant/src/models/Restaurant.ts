import mongoose, { Document } from "mongoose";

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  image: string;
  ownerId: string;
  phone: number;
  isVerified: boolean;
  autoLocation: {
    type: "Point";
    coordinates: [number, number]; // [longitude,latitude],
    formattedAddress: string;
  };
  isOpen: boolean;
  createdAt: Date;
}

const schema = new mongoose.Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    isVerified: {
      type: Boolean,
      required: true,
    },
    autoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      formattedAddress: {
        type: String,
      },
    },
    isOpen: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

schema.index({
  autoLocation: "2dsphere",
});

export const Restaurant = mongoose.model("Restaurant", schema);
