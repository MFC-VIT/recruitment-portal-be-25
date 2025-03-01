const UserModel = require("../models/userModel");
const mongoose = require("mongoose");
const Response = require("../utils/responseModel")

const UpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { mobile, emailpersonal, domain, volunteeredEvent, participatedEvent } = req.body;
    
    if (!mobile || !emailpersonal || !domain) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isProfileDone) {
      return res.status(400).json({ message: "Profile update is already completed. Use update profile for modifications." });
    }

    user.mobile = mobile;
    user.emailpersonal = emailpersonal;
    user.domain = domain;
    user.volunteeredEvent = volunteeredEvent;
    user.participatedEvent = participatedEvent;
    user.isProfileDone = true;
    
    await user.save();
    return res.status(200).json({ message: "Profile updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const UpdateUserDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ message: "Domain is required." });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.domain = domain
    await user.save();
    
    return res.status(200).json({ message: "Domain updated successfully.", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { UpdateUser, UpdateUserDomain };


const getuser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = await UserModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "techtasks",
          localField: "_id",
          foreignField: "user_id",
          as: "techTasks",
        },
      },
      {
        $lookup: {
          from: "designtasks",
          localField: "_id",
          foreignField: "user_id",
          as: "designTasks",
        },
      },
      {
        $lookup: {
          from: "managementtasks",
          localField: "_id",
          foreignField: "user_id",
          as: "managementTasks",
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          regno: 1,
          verified: 1,
          mobile: 1,
          emailpersonal: 1,
          domain: 1,
          volunteered: 1,
          volunteeredEvent: 1,
          participated: 1,
          participatedEvent: 1,
          roundOne: 1,
          roundTwo: 1,
          roundThree: 1,
          isProfileDone: 1,
          isJC: 1,
          isSC: 1,
          techSubdomains: "$techTasks.subdomain",
          techIsDone: "$techTasks.isDone",
          designSubdomains: "$designTasks.subdomain",
          designIsDone: "$designTasks.isDone",
          managementSubdomains: "$managementTasks.subdomain",
          managementIsDone: "$managementTasks.isDone",
        },
      },
    ]);

    if (userData.length === 0) {
      const response = new Response(
          400,
          null,
          "User not found",
          false
        )
        res.status(response.statusCode).json(response);
    }
    const response = new Response (
      200,
      userData[0],
      "User Data",
      true
    )
    res.status(response.statusCode).json(response);
  } catch (error) {
    console.error(error);
    const response = new Response(
      500,
      null,
      error.message,
      false
    )
    res.status(response.statusCode).json(response);
  }
};

module.exports = { UpdateUserDomain, UpdateUser, getuser };
