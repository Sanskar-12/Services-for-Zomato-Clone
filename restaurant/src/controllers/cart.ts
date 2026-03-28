import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { Cart } from "../models/Cart.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Please Login",
    });
  }

  const userId = user?._id;

  const { restaurantId, itemId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(restaurantId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid restaurant and item Id",
    });
  }

  const cartFromDifferentRestaurant = await Cart.findOne({
    userId: userId,
    restaurantId: {
      $ne: new mongoose.Types.ObjectId(restaurantId),
    },
  });

  if (cartFromDifferentRestaurant) {
    return res.status(400).json({
      success: false,
      message:
        "You can order from only one restaurant at a time. Please clear your cart first to add items from this restaurant.",
    });
  }

  const cartItem = await Cart.findOneAndUpdate(
    { userId, restaurantId, itemId },
    {
      $inc: {
        quantity: 1,
      },
      $setOnInsert: {
        userId,
        restaurantId,
        itemId,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return res.status(200).json({
    success: true,
    cart: cartItem,
  });
});
