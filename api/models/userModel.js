const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    regno: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    // roundOne: {
    //   type: Boolean,
    //   required: true,
    //   default: false,
    // },
    // roundTwo: {
    //   type: Boolean,
    //   required: true,
    //   default: false,
    // },
    // roundThree: {
    //   type: Boolean,
    //   required: true,
    //   default: false,
    // },

    tech: {
      type: Number,
      required: true,
      default: 0,
    },
    design: {
      type: Number,
      required: true,
      default: 0,
    },
    management: {
      type: Number,
      required: true,
      default: 0,
    },

    isCore: {
      type: Boolean,
      required: true,
      default: false,
    },
    mobile: {
      type: Number,
    },
    emailpersonal: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    domain: {
      type: [String],
      enum: ["tech", "design", "management"],
      default: [],
    },
    // volunteered: {
    //   type: Boolean,
    // },
    volunteeredEvent: {
      type: String,
    },
    // participated: {
    //   type: Boolean,
    // },
    participatedEvent: {
      type: String,
    },
    prevAccessToken: {
      type: [String],
      default: [],
    },
    isProfileDone: {
      type: Boolean,
      required: true,
      default: false,
    },
    admin: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    emailToken: {
      type: String,
    },
    isSC: {
      type: Boolean,
    },
    isJC: {
      type: Boolean,
    },
    isDesignDone: {
      type: Boolean,
      default: false,
    },
    isManagementDone: {
      type: Boolean,
      default: false,
    },
    isTechDone: {
      type: Boolean,
      default: false,
    },
    googleRefreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
