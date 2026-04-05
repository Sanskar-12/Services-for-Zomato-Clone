import axios from "axios";
import { razorpay } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/payment.producer.js";
import dotenv from "dotenv";
import Stripe from "stripe";
dotenv.config();
export const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/order/payment/${orderId}`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        const razorpayOrder = await razorpay.orders.create({
            amount: data.amount * 100,
            currency: "INR",
            receipt: orderId,
        });
        return res.status(200).json({
            success: true,
            razorpayOrderId: razorpayOrder?.id,
            key: process.env.RAZORPAY_API_KEY,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, } = req.body;
        const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }
        await publishPaymentSuccess({
            orderId,
            paymentId: razorpay_payment_id,
            provider: "razorpay",
        });
        return res.status(200).json({
            success: true,
            message: "Payment Verified Successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const payWithStripe = async (req, res) => {
    try {
        const { orderId } = req.body;
        const { data: orderData } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/order/payment/${orderId}`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/order/get/user/${orderId}`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
        });
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: "Zomato",
                        },
                        unit_amount: orderData.amount * 100,
                    },
                    quantity: 1,
                },
            ],
            billing_address_collection: "required",
            customer_email: data.user.email,
            customer_creation: "always",
            metadata: {
                orderId,
            },
            success_url: `${process.env.FRONTEND_URL}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
        });
        return res.status(200).json({
            success: true,
            url: session.url,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const verifyStripe = async (req, res) => {
    const { sessionId } = req.body;
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order Id not found in stripe session",
            });
        }
        await publishPaymentSuccess({
            orderId,
            paymentId: sessionId,
            provider: "stripe",
        });
        res.status(200).json({
            success: true,
            message: "Payment Verified successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
