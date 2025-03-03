import express from "express";
import { modelController } from "../controllers/index.js";

const router = express.Router();

router.post("/addModel", modelController.addModel);
router.delete("/deleteModel", modelController.deleteModel);
router.get("/getAllModels", modelController.getAllModels);
router.get("/getModelById", modelController.getModelById);
router.put("/updateModel", modelController.updateModel);

export default router;
