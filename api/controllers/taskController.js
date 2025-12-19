const UserModel = require("../models/userModel");
const TechTaskModel = require("../models/techTaskModel");
const ManagmentTaskModel = require("../models/managementModel");
const DesignTaskModel = require("../models/designTaskModel");
const Response = require("../utils/responseModel");

const saveTaskManagement = async (req, res) => {
  const { id } = req.params;
  const isSubmission = req.method === "POST";
  try {
    const task = await ManagmentTaskModel.findOneAndUpdate(
      { user_id: id },
      { ...req.body, user_id: id, isDone: isSubmission },
      { upsert: true, new: true, runValidators: true }
    );

    if (isSubmission) {
      await UserModel.findByIdAndUpdate(id, {
        isManagementDone: true,
      });
    }

    const response = new Response(
      200,
      task,
      `Management Task ${isSubmission ? "Submitted" : "Saved"} Successfully`,
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const saveTaskTech = async (req, res) => {
  const { id } = req.params;
  const isSubmission = req.method === "POST";
  try {
    const task = await TechTaskModel.findOneAndUpdate(
      { user_id: id },
      { ...req.body, user_id: id, isDone: isSubmission },
      { upsert: true, new: true, runValidators: true }
    );

    if (isSubmission) {
      await UserModel.findByIdAndUpdate(id, {
        isTechDone: true,
      });
    }

    const response = new Response(
      200,
      task,
      `Tech Task ${isSubmission ? "Submitted" : "Saved"} Successfully`,
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const saveTaskDesign = async (req, res) => {
  const { id } = req.params;
  const isSubmission = req.method === "POST";
  try {
    const task = await DesignTaskModel.findOneAndUpdate(
      { user_id: id },
      { ...req.body, user_id: id, isDone: isSubmission },
      { upsert: true, new: true, runValidators: true }
    );

    if (isSubmission) {
      await UserModel.findByIdAndUpdate(id, {
        isDesignDone: true,
      });
    }

    const response = new Response(
      200,
      task,
      `Design Task ${isSubmission ? "Submitted" : "Saved"} Successfully`,
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

module.exports = {
  saveTaskManagement,
  saveTaskTech,
  saveTaskDesign,
};

