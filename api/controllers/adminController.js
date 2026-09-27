const UserModel = require("../models/userModel");
const Response = require("../utils/responseModel");
const mongoose = require("mongoose");
const StatusEvent = require("../models/statusEventModel");

const DOMAINS = ["tech", "design", "management"];

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const send = (res, statusCode, data, message) => {
  const response = new Response(statusCode, data, message, statusCode < 400);
  return res.status(response.statusCode).json(response);
};

// Users joined with their submissions, grouped the way the old
// techTasks/designTasks/managementTasks arrays were so existing clients keep working.
const usersWithSubmissions = ({ match, subdomain, skip, limit }) => {
  const byDomain = (domain) => ({
    $filter: {
      input: "$submissions",
      cond: {
        $and: [
          { $eq: ["$$this.domain", domain] },
          subdomain ? { $in: [subdomain, "$$this.subdomain"] } : true,
        ],
      },
    },
  });
  return UserModel.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "submissions",
        localField: "_id",
        foreignField: "user_id",
        as: "submissions",
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
        volunteeredEvent: 1,
        participatedEvent: 1,
        tech: 1,
        design: 1,
        management: 1,
        isProfileDone: 1,
        isJC: 1,
        isSC: 1,
        createdAt: 1,
        techTasks: byDomain("tech"),
        designTasks: byDomain("design"),
        managementTasks: byDomain("management"),
      },
    },
  ]);
};

const listUsers = (forcedDomain) => async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) - 1 || 0, 0);
    const limit = Math.min(parseInt(req.query.limit) || 10000, 10000);
    const { subdomain } = req.query;
    const regno = req.body && req.body.regno;

    const match = {};
    const domains = forcedDomain
      ? [forcedDomain]
      : req.query.domain
      ? String(req.query.domain).split(",")
      : null;
    if (domains) match.domain = { $in: domains };
    if (regno) match.regno = { $regex: new RegExp(escapeRegex(regno), "i") };

    const users = await usersWithSubmissions({
      match,
      subdomain,
      skip: page * limit,
      limit,
    });
    return send(res, 200, users, "Users Fetched Successfully");
  } catch (error) {
    console.error(error);
    return send(res, 500, null, "Internal Server Error");
  }
};

const getAllUser = listUsers(null);
const getAllUserTech = listUsers("tech");
const getAllUserDesign = listUsers("design");
const getAllUserManagement = listUsers("management");

const getUserByRegNo = async (req, res) => {
  const { regNo } = req.body || {};
  if (!regNo) return send(res, 400, null, "regNo missing");
  try {
    const user = await UserModel.findOne({ regno: regNo }).select("_id");
    if (!user) return send(res, 404, null, "user with registration number not found");
    const userData = await usersWithSubmissions({
      match: { _id: new mongoose.Types.ObjectId(user._id) },
      skip: 0,
      limit: 1,
    });
    return send(res, 200, userData, "User Response fetched Successfully");
  } catch (error) {
    console.error(error);
    return send(res, 500, null, "Internal Server Error");
  }
};

// Sets a candidate's round per domain and records each change in StatusEvent.
const updateUserStatus = async (req, res) => {
  const { regno, note } = req.body || {};
  if (!regno) return send(res, 400, null, "Regno is required");

  try {
    const user = await UserModel.findOne({ regno });
    if (!user) return send(res, 404, null, `User with regno ${regno} not found`);

    const actor = await UserModel.findById(req.userId).select("email");
    const events = [];
    for (const domain of DOMAINS) {
      const next = req.body[domain];
      if (next === undefined) continue;
      if (![-1, 0, 1, 2, 3].includes(Number(next))) {
        return send(res, 400, null, `${domain} must be between -1 and 3`);
      }
      if (user[domain] === Number(next)) continue;
      events.push({
        user_id: user._id,
        domain,
        from: user[domain] || 0,
        to: Number(next),
        actor: actor ? actor.email : "admin",
        note: note || "",
      });
      user[domain] = Number(next);
    }

    await user.save();
    if (events.length) await StatusEvent.insertMany(events);
    return send(res, 200, { changes: events.length }, `User with regno ${regno} updated successfully`);
  } catch (error) {
    console.error("Error updating user status:", error);
    return send(res, 500, null, "Error updating status");
  }
};

// Grants admin to an existing account. The route is already admin-only.
const makeAdmin = async (req, res) => {
  const { email } = req.body || {};
  if (!email) return send(res, 400, null, "email is required");
  try {
    const user = await UserModel.findOneAndUpdate(
      { email: String(email).toLowerCase() },
      { admin: true },
      { new: true }
    ).select("username email admin");
    if (!user) return send(res, 404, null, "User not found");
    return send(res, 200, user, "User is now an admin");
  } catch (error) {
    return send(res, 500, null, error.message);
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
