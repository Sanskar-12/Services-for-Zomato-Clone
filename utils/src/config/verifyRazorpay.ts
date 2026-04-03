import crypto from "crypto";

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string,
) => {
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature === signature) {
    return true;
  } else {
    return false;
  }
};
