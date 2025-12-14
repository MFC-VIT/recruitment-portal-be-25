const UserModel = require("../models/userModel");
const Response = require("../utils/responseModel");

const applicationStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Overall status derived from domain-specific progress flags
    const domains = Array.isArray(user.domain) ? user.domain : [];
    const progress = {
      tech: user.tech || 0,
      design: user.design || 0,
      management: user.management || 0,
    };
    const submitted = {
      tech: !!user.isTechDone,
      design: !!user.isDesignDone,
      management: !!user.isManagementDone,
    };

    // Final selection
    if (user.isCore === true) {
      return res.status(200).json({
        message: "Congratulations! You have been selected.",
      });
    }

    // Third round reached in any applied domain
    if (
      (domains.includes("tech") && submitted.tech && progress.tech === 2) ||
      (domains.includes("design") &&
        submitted.design &&
        progress.design === 2) ||
      (domains.includes("management") &&
        submitted.management &&
        progress.management === 2)
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the third round. All the best.",
      });
    }

    // Second round reached in any applied domain
    if (
      (domains.includes("tech") && submitted.tech && progress.tech === 1) ||
      (domains.includes("design") &&
        submitted.design &&
        progress.design === 1) ||
      (domains.includes("management") &&
        submitted.management &&
        progress.management === 1)
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the second round. All the best.",
        redirectTo: "/meeting",
      });
    }

    // Not submitted in any applied domain
    if (
      (domains.includes("tech") && !submitted.tech) ||
      (domains.includes("design") && !submitted.design) ||
      (domains.includes("management") && !submitted.management)
    ) {
      return res.status(200).json({
        message:
          "Your application is not submitted for at least one selected domain. Kindly complete and submit it for evaluation.",
      });
    }

    // Under evaluation default
    return res.status(200).json({
      message: "Your application is under evaluation. Stay tuned for results.",
    });
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const applicationTechStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        passed: 0,
      });
    }

    if (!user.domain.includes("tech")) {
      return res.status(200).json({
        message: "You have not applied for the Tech Domain.",
        passed: 0,
      });
    }

    if (user.domain.includes("tech") && !user.isTechDone) {
      return res.status(200).json({
        message:
          "Your application for the Tech Domain is not submitted. Kindly complete and submit it for evaluation.",
        passed: 0,
      });
    }

    if (user.domain.includes("tech") && user.isTechDone && user.tech === 0) {
      return res.status(200).json({
        message:
          "Your application for the Tech Domain is under evaluation. Stay tuned for results.",
        passed: 0,
      });
    }

    if (user.domain.includes("tech") && user.isTechDone && user.tech === 1) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the second round of Tech. All the best.",
        redirectTo: "/meeting",
        passed: 1,
      });
    }

    if (user.domain.includes("tech") && user.isTechDone && user.tech === 2) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the third round. All the best.",
      });
    }

    if (
      user.domain.includes("tech") &&
      user.isTechDone &&
      user.tech === 3 &&
      user.isCore
    ) {
      return res.status(200).json({
        message: "Congratulations! You have been selected.",
      });
    }

    return res.status(200).json({
      message: "Unknown application status.",
    });
  } catch (error) {
    console.error(error);
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const applicationDesignStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        passed: 0,
      });
    }

    if (!user.domain.includes("design")) {
      return res.status(200).json({
        message: "You have not applied for the design Domain.",
        passed: 0,
      });
    }

    if (user.domain.includes("design") && !user.isDesignDone) {
      return res.status(200).json({
        message:
          "Your application for the Design Domain is not submitted. Kindly complete and submit it for evaluation.",
          passed: 0,
      });
    }

    if (
      user.domain.includes("design") &&
      user.isDesignDone &&
      user.design === 0
    ) {
      return res.status(200).json({
        message:
          "Your application for the Design Domain is under evaluation. Stay tuned for results.",
          passed: 0,
          
      });
    }

    if (
      user.domain.includes("design") &&
      user.isDesignDone &&
      user.design === 1
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the second round of Design. All the best.",
          redirectTo: "/meeting",
          passed: 1,
      });
    }

    if (
      user.domain.includes("design") &&
      user.isDesignDone &&
      user.design === 2
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the third round. All the best.",
      });
    }

    if (
      user.domain.includes("design") &&
      user.isDesignDone &&
      user.design === 3 &&
      user.isCore
    ) {
      return res.status(200).json({
        message: "Congratulations! You have been selected.",
      });
    }

    return res.status(200).json({
      message: "Unknown application status.",
    });
  } catch (error) {
    console.error(error);
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

const applicationManagementStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        passed: 0,
      });
    }

    if (!user.domain.includes("management")) {
      return res.status(200).json({
        message: "You have not applied for the management Domain.",
        passed: 0,
      });
    }

    if (user.domain.includes("management") && !user.isManagementDone) {
      return res.status(200).json({
        message:
          "Your application for the management Domain is not submitted. Kindly complete and submit it for evaluation.",
          passed: 0,
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management === 0
    ) {
      return res.status(200).json({
        message:
          "Your application for the management Domain is under evaluation. Stay tuned for results.",
          passed: 0,
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management === 1
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the second round of Management. All the best.",
        redirectTo: "/meeting",
        passed: 1,
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management === 2
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the third round. All the best.",
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management === 3 &&
      user.isCore
    ) {
      return res.status(200).json({
        message: "Congratulations! You have been selected.",
      });
    }

    return res.status(200).json({
      message: "Unknown application status.",
    });
  } catch (error) {
    console.error(error);
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

module.exports = {
  applicationTechStatus,
  applicationDesignStatus,
  applicationManagementStatus,
  applicationStatus,
};
