// const multer = require("multer");
const UserModel = require("../models/userModel");
const TechTaskModel = require("../models/techTaskModel");
const ManagmentTaskModel = require("../models/managementModel");
const DesignTaskModel = require("../models/designTaskModel");
const Response = require("../utils/responseModel");

const uploadTaskManagment = async (req, res) => {
  const { id } = req.params;
  const {
    question1,
    question2,
    question3,
    question4,
    question5,
    question6,
    question7,
    question8,
    question9,
    question10,
    question11,
    question12,
    question13,
    question14,
    question15,
    question16,
    question17,
    question18,
    question19,
    question20,
    question21,
    question22,
    question23,
    question24,
    question25,
    subdomain,
  } = req.body;
  try {
    const user = await ManagmentTaskModel.findOne({
      user_id: id,
    });

    if (user && user.isDone === true) {
      const response = new Response (
        200,
        null,
        "Already file submitted",
        true
      )
      return res.status(response.statusCode).json(response);
    }

    const task = new ManagmentTaskModel({
      user_id: id,
      question1: question1,
      question2: question2,
      question3: question3,
      question4: question4,
      question5: question5,
      question6: question6,
      question7: question7,
      question8: question8,
      question9: question9,
      question10: question10,
      question11: question11,
      question12: question12,
      question13: question13,
      question14: question14,
      question15: question15,
      question16: question16,
      question17: question17,
      question18: question18,
      question19: question19,
      question20: question20,
      question21: question21,
      question22: question22,
      question23: question23,
      question24: question24,
      question25: question25,

      subdomain: subdomain,
      isDone: true,
    });

    const savedTask = await task.save();

    await UserModel.findByIdAndUpdate(id, {
      isManagementDone: true,
    });

    const response = new Response (
      200,
      savedTask,
      "Task Uploaded Successfully",
      true
    );
    res.status(response.statusCode).json(response)
  } catch (error) {
    const response = new Response(
      500,
      null,
      error.message,
      false
    )
    res.status(response.statusCode).json(response);
  }
};

const uploadTaskTech = async (req, res) => {
  try {
    const { id } = req.params;
    const { question1, question2, question3, question4, subdomain } = req.body;
    console.log(id);
    const user = await TechTaskModel.findOne({
      user_id: id,
    });
    console.log("user2", user);

    if (user && user.isDone === true) {
      const response = new Response (
        200,
        null,
        "Already file submitted",
        true
      )
      return res.status(response.statusCode).json(response);
    }

    const task = new TechTaskModel({
      user_id: id,
      question1: question1,
      question2: question2,
      question3: question3,
      question4: question4,
      subdomain: subdomain,
      isDone: true,
    });
    const savedTask = await task.save();
    await UserModel.findByIdAndUpdate(id, {
      isTechDone: true,
    });

    const response = new Response (
      200,
      savedTask,
      "Task Uploaded Successfully",
      true
    );
    res.status(response.statusCode).json(response)
  } catch (error) {
    const response = new Response(
      500,
      null,
      error.message,
      false
    )
    res.status(response.statusCode).json(response);
  }
};

const uploadDesignTech = async (req, res) => {
  const { id } = req.params;
  const {
    question1,
    question2,
    question3,
    question4,
    question5,
    question6,
    question7,
    question8,
    question9,
    question10,
    question11,
    question12,
    question13,
    question14,
    question15,
    subdomain,
  } = req.body;
  try {
    const user = await DesignTaskModel.findOne({
      user_id: id,
    });

    if (user && user.isDone === true) {
      const response = new Response (
        200,
        null,
        "Already file submitted",
        true
      )
      return res.status(response.statusCode).json(response);
    }

    const task = new DesignTaskModel({
      user_id: id,
      question1: question1,
      question2: question2,
      question3: question3,
      question4: question4,
      question5: question5,
      question6: question6,
      question7: question7,
      question8: question8,
      question9: question9,
      question10: question10,
      question11: question11,
      question12: question12,
      question13: question13,
      question14: question14,
      question15: question15,
      subdomain: subdomain,
      isDone: true,
    });
    const savedTask = await task.save();

    await UserModel.findByIdAndUpdate(id, {
      isDesignDone: true,
    });
    
    const response = new Response (
      200,
      savedTask,
      "Task Uploaded Successfully",
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(
      500,
      null,
      error.message,
      false
    )
    res.status(response.statusCode).json(response);
  }
};

module.exports = {
  uploadDesignTech,
  uploadTaskManagment,
  uploadTaskTech,
};
