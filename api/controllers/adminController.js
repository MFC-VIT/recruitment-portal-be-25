const UserModel = require("../models/userModel");
const Response = require("../utils/responseModel");
const mongoose = require("mongoose")
const TechTaskModel = require("../models/techTaskModel");
const DesignTaskModel = require("../models/designTaskModel");
const ManagementTaskModel = require("../models/managementModel")

const getUserByRegNo = async (req,res) => {
  const {regNo} = req.body;

  if(!regNo) {
    const response = new Response(
      400,
      null,
      "regNo missing",
      false
    );
    return res.status(response.statusCode).json(response);
  }

  console.log(regNo)

  const user = await UserModel.findOne({regno: regNo});

  if (!user) {
    const response = new Response (
      400,
      null,
      "user with registartion number not found",
      false
    );
    return res.status(response.statusCode).json(response);
  }

  console.log(user.id)

  const userData = await UserModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(user.id) },
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
          }
  ])

  console.log(user)

  const response = new Response(
    200,
    userData,
    "User Response fetched Successfully",
    true
  )

  return res.status(response.statusCode).json(response);

}

const getAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 10000000;
    const skip = page * limit;

    const { domain, subdomain } = req.query;
    const { regno } = req.body;

    let filter = {};

    if (domain) {
      filter.domain = { $in: domain.split(",") };
    }

    if (regno) {
      filter.regno = { $regex: new RegExp(regno, "i") };
    }

    // if (name) {
    //   filter.username = { $regex: new RegExp(name, "i") };
    // }
    console.log("filter", filter);

    const users = await UserModel.aggregate([
      {
        $match: filter,
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
          techTasks: {
            $filter: {
              input: "$techTasks",
              as: "task",
              cond: {
                $in: [subdomain, "$$task.subdomain"],
              },
            },
          },
          designTasks: {
            $filter: {
              input: "$designTasks",
              as: "task",
              cond: {
                $in: [subdomain, "$$task.subdomain"],
              },
            },
          },
          managementTasks: {
            $filter: {
              input: "$managementTasks",
              as: "task",
              cond: {
                $in: [subdomain, "$$task.subdomain"],
              },
            },
          },
          isDoneTech: "$techTasks",
          isDoneDesign: "$designTasks",
          isDoneManagement: "$managementTasks",
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);
    const response = new Response (
      100,
      users,
      "Users Fetched Successfully",
      true,
    )
    res.status(response.statusCode).json(response)
  } catch (error) {
    console.error(error);
    const response = new Response(
      500,
      null,
      "Internal Server Error",
      false
    );
    res.status(response.statusCode).json(response)
  }
};

const getAllUserTech = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 10000000;
    const skip = page * limit;

    const { domain, subdomain } = req.query;
    const { regno } = req.body;

    let filter = {};

    if (domain) {
      filter.domain = { $in: domain.split(",") };
    }

    if (regno) {
      filter.regno = { $regex: new RegExp(regno, "i") };
    }

    console.log("filter", filter);

    const users = await UserModel.aggregate([
      // {
      //   $match: filter,
      // },
      {
        $lookup: {
          from: "techtasks",
          localField: "_id",
          foreignField: "user_id",
          as: "techTasks",
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          regno: 1,
          mobile: 1,
          emailpersonal: 1,
          domain: 1,
          volunteeredEvent: 1,
          participatedEvent: 1,
          techTasks: 1,
          isDoneTech: {
            $in: [true, "$techTasks.isDone"],
          },
        },
      },
      {
        $match: {
          isDoneTech: true,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const response = new Response (
      100,
      users,
      "Users Fetched Successfully",
      true,
    )
    res.status(response.statusCode).json(response)
  } catch (error) {
    console.error(error);
    const response = new Response(
      500,
      null,
      "Internal Server Error",
      false
    );
    res.status(response.statusCode).json(response)
  }
};

const getAllUserDesign = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 10000000;
    const skip = page * limit;

    const { domain, subdomain } = req.query;
    const { regno } = req.body;

    let filter = {};

    if (domain) {
      filter.domain = { $in: domain.split(",") };
    }

    if (regno) {
      filter.regno = { $regex: new RegExp(regno, "i") };
    }

    console.log("filter", filter);

    const users = await UserModel.aggregate([
      // {
      //   $match: filter,
      // },
      {
        $lookup: {
          from: "designtasks",
          localField: "_id",
          foreignField: "user_id",
          as: "designTasks",
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          regno: 1,
          mobile: 1,
          emailpersonal: 1,
          domain: 1,
          volunteeredEvent: 1,
          participatedEvent: 1,
          designTasks: 1,
          isDoneDesign: {
            $in: [true, "$designTasks.isDone"],
          },
        },
      },
      {
        $match: {
          isDoneDesign: true,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const response = new Response (
      100,
      users,
      "Users Fetched Successfully",
      true,
    )
    res.status(response.statusCode).json(response)
  } catch (error) {
    console.error(error);
    const response = new Response(
      500,
      null,
      "Internal Server Error",
      false
    );
    res.status(response.statusCode).json(response)
  }
};

const getAllUserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 10000000;
    const skip = page * limit;

    const { domain, subdomain } = req.query;
    const { regno } = req.body;

    let filter = {};

    if (domain) {
      filter.domain = { $in: domain.split(",") };
    }

    if (regno) {
      filter.regno = { $regex: new RegExp(regno, "i") };
    }

    console.log("filter", filter);

    const users = await UserModel.aggregate([
      // {
      //   $match: filter,
      // },
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
          mobile: 1,
          emailpersonal: 1,
          domain: 1,
          volunteeredEvent: 1,
          participatedEvent: 1,
          managementTasks: 1,
          isDoneManagement: {
            $in: [true, "$managementTasks.isDone"],
          },
        },
      },
      {
        $match: {
          isDoneManagement: true,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const response = new Response (
      100,
      users,
      "Users Fetched Successfully",
      true,
    )
    res.status(response.statusCode).json(response)
  } catch (error) {
    console.error(error);
    const response = new Response(
      500,
      null,
      "Internal Server Error",
      false
    );
    res.status(response.statusCode).json(response)
  }
};

const updateUserStatus = async (req, res) => {
  const { regno, roundOne, roundTwo, roundThree } = req.body;
  const successMessages = [];
  const errorMessages = [];

  try {
    if (!regno) {
      return res.status(400).json({ message: "Regno is required" });
    }

    for (const reg of regno) {
      const user = await UserModel.findOne({ regno: reg });
      if (!user) {
        errorMessages.push(`User with regno ${reg} not found`);
        continue;
      }

      if (roundOne !== undefined) {
        user.roundOne = roundOne;
      }
      if (roundTwo !== undefined) {
        user.roundTwo = roundTwo;
      }
      if (roundThree !== undefined) {
        user.roundThree = roundThree;
      }

      await user.save();
      successMessages.push(`User with regno ${reg} updated successfully`);
    }

    // const response = {
    //   successMessages: successMessages,
    //   errorMessages: errorMessages,
    // };

    const response = new Response (
      200,
      null,
      successMessages,
      true
    );

    res.status(response.statusCode).json(response);
  } catch (error) {
    console.error("Error updating user status:", error);
    const response = new Response (
      500,
      null,
      "Error Updating Messages",
      false
    )
    res.status(response.statusCode).json(response)
  }
};

const makeAdmin = async (req, res) => {
  const { email, secretcode, secretcode2 } = req.body;
  try {
    if (
      secretcode === process.env.ACCESS_TOKEN_SECERT &&
      secretcode2 === process.env.PORT
    ) {
      const user = await UserModel.findByOneAndUpdate(
        { email },
        {
          admin: true,
        },
        { new: true }
      );
      res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUser,
  updateUserStatus,
  makeAdmin,
  getAllUserTech,
  getAllUserManagement,
  getAllUserDesign,
  getUserByRegNo,
};
