import { SubscriptionPlan } from "../models/index.js";
import axios from "axios";
import crypto from 'crypto';
import { User } from "../models/index.js";
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

    // Find the subscription plan and user
    const [plan, user] = await Promise.all([
      SubscriptionPlan.findById(planId),
      User.findById(userId)
    ]);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate unique references
    const orderId = `sub_${userId}_${planId}_${Date.now()}`;
    const paymentRef = `pay_${crypto.randomBytes(8).toString('hex')}`;

    // Create payload
    const payload = {
      price_amount: plan.price,
      price_currency: "usd",
      pay_currency: pay_currency,
      order_id: orderId,
      ipn_callback_url: `${process.env.NOWPAYMENTS_CALLBACK_URL}`,
      order_description: `Subscription: ${plan.title} (${plan.points} points)`,
      is_fixed_rate: true,
      is_fee_paid_by_user: false,
      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
    };

    // Create HMAC signature
    const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_KEY);
    hmac.update(JSON.stringify(payload, Object.keys(payload).sort()));
    const signature = hmac.digest('hex');

    // Create temporary payment record
    const tempPayment = await Payment.create({
      userId,
      planId,
      amount: plan.price,
      currency: 'usd',
      paymentId: paymentRef,
      orderId,
      status: 'pending',
      pointsToAdd: plan.points
    });

    // Make API request
    const response = await axios.post(
      `${process.env.NOWPAYMENTS_BASE_URL}/v1/invoice`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'x-nowpayments-sig': signature
        },
        timeout: 10000
      }
    );

    const paymentData = response.data;

    // Update payment record with API response
    await Payment.findByIdAndUpdate(tempPayment._id, {
      paymentId: paymentData.id,
      paymentStatus: paymentData.payment_status,
      paymentAddress: paymentData.pay_address,
      paymentAmount: paymentData.pay_amount,
      paymentCurrency: paymentData.pay_currency,
      invoiceUrl: paymentData.invoice_url
    });

    res.status(200).json({
      success: true,
      message: "Payment link generated successfully",
      data: {
        paymentLink: paymentData.invoice_url || `https://nowpayments.io/payment/?iid=${paymentData.id}`,
        paymentDetails: {
          paymentId: paymentData.id,
          status: paymentData.payment_status,
          amount: paymentData.pay_amount,
          currency: paymentData.pay_currency,
          orderId: paymentData.order_id,
          expiration: paymentData.expiration_date
        }
      }
    });

  } catch (error) {
    console.error("Error generating payment link:", error);
    
    // Update payment record if it exists
    if (tempPayment) {
      await Payment.findByIdAndUpdate(tempPayment._id, {
        status: 'failed',
        error: error.message
      });
    }

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "Internal server error";
    
    res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null
    });
  }
}

export async function handleIPNCallback(req, res) {
  try {
    // Verify the IPN signature
    const signature = req.headers['x-nowpayments-sig'];
    const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_KEY);
    hmac.update(JSON.stringify(req.body, Object.keys(req.body).sort()));
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid IPN signature');
      return res.status(401).json({
        success: false,
        message: "Invalid signature"
      });
    }

    const { payment_status, order_id, payment_id, pay_amount, pay_currency } = req.body;

    // Find the payment record
    const payment = await Payment.findOne({ orderId: order_id });
    if (!payment) {
      console.error('Payment record not found for order:', order_id);
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }

    // Update payment status
    payment.paymentStatus = payment_status;
    payment.actualAmount = pay_amount;
    payment.actualCurrency = pay_currency;
    payment.ipnReceivedAt = new Date();

    // Only process completed payments
    if (payment_status === 'finished') {
      // Verify payment hasn't already been processed
      if (payment.status === 'completed') {
        return res.status(200).json({
          success: true,
          message: "Payment already processed"
        });
      }

      // Verify amount matches
      if (Math.abs(pay_amount - payment.amount) > 0.01) {
        payment.status = 'amount_mismatch';
        await payment.save();
        return res.status(400).json({
          success: false,
          message: "Payment amount mismatch"
        });
      }

      // Process the payment
      const [user, plan] = await Promise.all([
        User.findByIdAndUpdate(
          payment.userId,
          { $inc: { points: payment.pointsToAdd } },
          { new: true }
        ),
        SubscriptionPlan.findById(payment.planId)
      ]);

      if (!user) {
        payment.status = 'user_not_found';
        await payment.save();
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      if (!plan) {
        payment.status = 'plan_not_found';
        await payment.save();
        return res.status(404).json({
          success: false,
          message: "Subscription plan not found"
        });
      }

      // Update payment record
      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.pointsAdded = payment.pointsToAdd;
      payment.newBalance = user.points;

      // You might want to send a confirmation email here
      // await sendPaymentConfirmationEmail(user.email, payment, plan);
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: "IPN processed successfully"
    });

  } catch (error) {
    console.error("Error processing IPN callback:", error);
    
    // Update payment record if it exists
    if (payment) {
      payment.status = 'ipn_error';
      payment.error = error.message;
      await payment.save();
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
