import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  // User and Plan References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  
  // Payment Information
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'usd'
  },
  pointsToAdd: {
    type: Number,
    required: true
  },
  
  // NOWPayments References
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'amount_mismatch', 'ipn_error'],
    default: 'pending'
  },
  paymentStatus: String, // Raw status from NOWPayments
  
  // Payment Details
  paymentAddress: String,
  paymentAmount: Number,
  paymentCurrency: String,
  invoiceUrl: String,
  
  // Points Information (after processing)
  pointsAdded: Number,
  newBalance: Number,
  
  // Error Handling
  error: String,
  
  // Timestamps
  ipnReceivedAt: Date,
  processedAt: Date
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for faster queries
paymentSchema.index({ userId: 1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.model("Payment", paymentSchema);