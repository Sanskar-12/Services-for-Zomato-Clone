import { NextFunction, Response, Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  restaurantId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please Login - No auth header",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please Login - Token missing",
      });
    }

    const decodedValue = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    if (!decodedValue || !decodedValue.user) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    req.user = decodedValue.user;

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Please Login - Jwt error",
    });
  }
};

export const isSeller = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = req.user;

  if (user && user.role !== "seller") {
    res.status(401).json({
      success: false,
      message: "You are not a authorised seller",
    });
    return;
  }

  next();
};
