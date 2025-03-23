import express from "express";
import { subscriptionController } from "../controllers/index.js";

const router = express.Router();

router.post(
  "/createSubscriptionPlan",
  subscriptionController.createSubscriptionPlan
);
router.delete(
  "/deleteSubscriptionPlan",
  subscriptionController.deleteSubscriptionPlan
);
router.put(
  "/editSubscriptionPlan",
  subscriptionController.editSubscriptionPlan
);
router.get(
  "/getAllSubscriptionPlans",
  subscriptionController.getAllSubscriptionPlans
);
router.post(
  "/generatePaymentLink",
  subscriptionController.generatePaymentLink
);

export default router;
