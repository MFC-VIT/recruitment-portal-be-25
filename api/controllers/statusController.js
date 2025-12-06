const UserModel = require("../models/userModel");
const applicationStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findOne({
      user_id: id,
    });
    if (user.roundOne === false) {
      res.status(200).json({
        message:
          "Your application is under evaluation. Stay tunned for results.",
      });
    } else if (user.roundOne === true && user.roundTwo === true) {
      res.status(200).json({
        message:
          "congratulations! You have been selected for second round. All the best.",
      });
    } else if (
      user.roundOne === true &&
      user.roundTwo === true &&
      user.roundThree === true
    ) {
      res.status(200).json({
        message:
          "congratulations! You have been selected for third round. All the best.",
      });
    } else if (
      user.roundOne === true &&
      user.roundTwo === true &&
      user.roundThree === true &&
      user.isCore === true
    ) {
      res.status(200).json({
        message: "congratulations! You have been selected.",
      });
    }
  } catch (error) {
    const response = new Response(
      500,
      null,
      error.message,
      false
    );
    res.status(response.statusCode).json(response)
  }
};

const applicationTechStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findOne({
      _id: id,
    });
    console.log("user23", id);
    console.log("ouser23", user);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.domain.includes("tech")) {
      return res.status(200).json({
        message: "You have not applied for the Tech Domain.",
      });
    }

    if (user.domain.includes("tech") && !user.isTechDone) {
      return res.status(200).json({
        message:
          "Your application for the Tech Domain is not submitted. Kindly complete and submit it for evaluation.",
      });
    }

    if (user.domain.includes("tech") && user.isTechDone && user.tech==0) {
      return res.status(200).json({
        message:
          "Your application for the Tech Domain is under evaluation. Stay tuned for results.",
      });
    }

    if (
      user.domain.includes("tech") &&
      user.isTechDone &&
      user.tech==1
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the second round of Tech. All the best.",
      });
    }

    if (
      user.domain.includes("tech") &&
      user.isTechDone &&
      user.tech==2
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the third round. All the best.",
      });
    }

    if (
      user.domain.includes("tech") &&
      user.isTechDone &&
      user.tech==3 &&
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
    const response = new Response(
      500,
      null,
      error.message,
      false
    );
    res.status(response.statusCode).json(response)
  }
};

const applicationDesignStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findOne({
      _id: id,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.domain.includes("design")) {
      return res.status(200).json({
        message: "You have not applied for the design Domain.",
      });
    }

    if (user.domain.includes("design") && !user.isDesignDone) {
      return res.status(200).json({
        message:
          "Your application for the Design Domain is not submitted. Kindly complete and submit it for evaluation.",
      });
    }

    if (user.domain.includes("design") && user.isDesignDone && user.design==0) {
      return res.status(200).json({
        message:
          "Your application for the Design Domain is under evaluation. Stay tuned for results.",
      });
    }

    if (
      user.domain.includes("design") &&
      user.isDesignDone &&
      user.design==1
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the second round of Tech. All the best.",
      });
    }

    if (
      user.domain.includes("design") &&
      user.isDesignDone &&
      user.design==2
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the third round. All the best.",
      });
    }

    if (
      user.domain.includes("design") &&
      user.isDesignDone &&
      user.design==3 &&
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
    return res.status(500).json({ message: "Internal server error" });
  }
};

const applicationManagementStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findOne({
      _id: id,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.domain.includes("management")) {
      return res.status(200).json({
        message: "You have not applied for the management Domain.",
      });
    }

    if (user.domain.includes("management") && !user.isManagementDone) {
      return res.status(200).json({
        message:
          "Your application for the management Domain is not submitted. Kindly complete and submit it for evaluation.",
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management==0
    ) {
      return res.status(200).json({
        message:
          "Your application for the management Domain is under evaluation. Stay tuned for results.",
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management==1
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the second round of Tech. All the best.",
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management==2
    ) {
      return res.status(200).json({
        message:
          "Congratulations! You have been selected for the third round. All the best.",
      });
    }

    if (
      user.domain.includes("management") &&
      user.isManagementDone &&
      user.management==3 &&
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
    const response = new Response(
      500,
      null,
      error.message,
      false
    );
    res.status(response.statusCode).json(response)
  }
};

module.exports = {
  applicationTechStatus,
  applicationDesignStatus,
  applicationManagementStatus,
  applicationStatus,
};
