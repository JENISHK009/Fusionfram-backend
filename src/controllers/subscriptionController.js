import { SubscriptionPlan } from "../models/index.js";
import axios from "axios";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_BASE_URL = process.env.NOWPAYMENTS_BASE_URL;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

// Create a new subscription plan
export async function createSubscriptionPlan(req, res) {
  try {
    const { title, description, points, features, price } = req.body;

    // Validate input
    if (!title || !description || points === undefined || !features || !price) {
      return res.status(400).json({
        success: false,
        message: "Title, description, points, price and features are required",
      });
    }

    // Create new subscription plan
    const newPlan = new SubscriptionPlan({
      title,
      price,
      description,
      points,
      features,
    });

    await newPlan.save();

    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Get all subscription plans
export async function getAllSubscriptionPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.find();
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Edit a subscription plan
export async function editSubscriptionPlan(req, res) {
  try {
    const { id, title, description, points, features, price, isActive } =
      req.body;

    // Validate input
    if (!title || !description || points === undefined || !features || !price) {
      return res.status(400).json({
        success: false,
        message: "Title, description, points, price and features are required",
      });
    }

    // Find and update the plan
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { title, description, points, features, price, isActive },
      { new: true } // Return the updated document
    );

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Delete a subscription plan
export async function deleteSubscriptionPlan(req, res) {
  try {
    const { id } = req.query; // Plan ID from URL

    // Find and delete the plan
    const deletedPlan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!deletedPlan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully",
      data: deletedPlan,
    });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Generate payment link using NOWPayments (supports all currencies)
export async function generatePaymentLink(req, res) {
  try {
    const { planId, userId, pay_currency } = req.body;

    // Validate input
    if (!planId || !userId || !pay_currency) {
      return res.status(400).json({
        success: false,
        message: "Plan ID, User ID, and Pay Currency are required",
      });
    }

    // Find the subscription plan
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    // Prepare the payload for NOWPayments
    const payload = {
      price_amount: plan.price, // Required: Fiat amount
      price_currency: "usd", // Required: Fiat currency (e.g., "usd", "eur")
      pay_currency: pay_currency, // Required: Cryptocurrency selected by the user
      ipn_callback_url: `${FRONTEND_BASE_URL}/ipn-callback`, // Optional: Callback URL for IPN
      order_id: `${userId}_${planId}_${Date.now()}`, // Optional: Unique order ID
      order_description: `Subscription plan: ${plan.title}`, // Optional: Order description
      is_fixed_rate: true, // Optional: Fixed rate (default: true)
      is_fee_paid_by_user: false, // Optional: Fee paid by user (default: false)
    };

    console.log("NOWPayments Payload:", payload);

    // Make a request to NOWPayments API to create a payment
    const response = await axios.post(
      `${NOWPAYMENTS_BASE_URL}/payment`,
      payload,
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("NOWPayments Response:", response.data);

    // Extract the payment details from the response
    const {
      payment_id,
      payment_status,
      pay_address,
      pay_amount,
      pay_currency: response_pay_currency,
      redirect_url, // Only available for fiat2crypto payments
    } = response.data;

    // Construct the payment link
    const paymentLink =
      redirect_url || `https://nowpayments.io/payment/?iid=${payment_id}`;

    console.log("Generated Payment Link:", paymentLink);

    res.status(200).json({
      success: true,
      message: "Payment link generated successfully",
      data: {
        paymentLink,
        paymentDetails: {
          payment_id,
          payment_status,
          pay_address,
          pay_amount,
          pay_currency: response_pay_currency,
        },
      },
    });
  } catch (error) {
    console.error("Error generating payment link:", error);

    // Handle specific errors
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || "Error from NOWPayments API",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
