import { Model } from "../models/index.js";

export async function addModel(req, res) {
  try {
    const modelData = req.body;
    const newModel = new Model(modelData);
    await newModel.save();

    res.status(201).json({
      success: true,
      message: "Model added successfully",
      data: newModel,
    });
  } catch (error) {
    console.error("Error adding model:", error);
    res.status(500).json({
      success: false,
      message: "Error adding model",
    });
  }
}

export async function getAllModels(req, res) {
  try {
    const models = await Model.find();
    res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching models",
    });
  }
}

export async function getModelById(req, res) {
  try {
    const { id } = req.query;
    const model = await Model.findById(id);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.status(200).json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error("Error fetching model by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching model by ID",
    });
  }
}

export async function updateModel(req, res) {
  try {
    const { id, ...updateData } = req.body; // Extract id and other fields from the body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required in the request body",
      });
    }

    const updatedModel = await Model.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedModel) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Model updated successfully",
      data: updatedModel,
    });
  } catch (error) {
    console.error("Error updating model:", error);
    res.status(500).json({
      success: false,
      message: "Error updating model",
    });
  }
}

export async function deleteModel(req, res) {
  try {
    const { id } = req.query;
    const deletedModel = await Model.findByIdAndDelete(id);

    if (!deletedModel) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Model deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting model:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting model",
    });
  }
}
