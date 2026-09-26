const UserModel = require("../models/userModel");
const TechTaskModel = require("../models/techTaskModel");
const ManagmentTaskModel = require("../models/managementModel");
const DesignTaskModel = require("../models/designTaskModel");
const Response = require("../utils/responseModel");

// Once a task is submitted it is final; drafts (PATCH) and re-submits are refused.
const saveTask = (Model, doneFlag, label) => async (req, res) => {
  const { id } = req.params;
  const isSubmission = req.method === "POST";
  try {
    const existing = await Model.findOne({ user_id: id }).select("isDone");
    if (existing && existing.isDone) {
      const response = new Response(
        409,
        null,
        `${label} Task has already been submitted`,
        false
      );
      return res.status(response.statusCode).json(response);
    }

    const { _id, user_id, isDone, createdAt, updatedAt, ...answers } =
      req.body || {};
    const task = await Model.findOneAndUpdate(
      { user_id: id },
      { ...answers, user_id: id, isDone: isSubmission },
      { upsert: true, new: true, runValidators: isSubmission }
    );

    if (isSubmission) {
      await UserModel.findByIdAndUpdate(id, { [doneFlag]: true });
    }

    const response = new Response(
      200,
      task,
      `${label} Task ${isSubmission ? "Submitted" : "Saved"} Successfully`,
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const saveTaskManagement = saveTask(
  ManagmentTaskModel,
  "isManagementDone",
  "Management"
);
const saveTaskTech = saveTask(TechTaskModel, "isTechDone", "Tech");
const saveTaskDesign = saveTask(DesignTaskModel, "isDesignDone", "Design");

const getTaskManagement = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await ManagmentTaskModel.findOne({ user_id: id });
    const response = new Response(
      200,
      task,
      "Management Task Fetched Successfully",
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const getTaskTech = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await TechTaskModel.findOne({ user_id: id });
    const response = new Response(
      200,
      task,
      "Tech Task Fetched Successfully",
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const getTaskDesign = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await DesignTaskModel.findOne({ user_id: id });
    const response = new Response(
      200,
      task,
      "Design Task Fetched Successfully",
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
  getTaskManagement,
  getTaskTech,
  getTaskDesign,
};

