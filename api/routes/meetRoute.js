const express = require("express")
const app = express();
app.use(express.json());
const router = express.Router();
const{scheduleMeeting,cancelMeeting} = require("../meet/schedule");
const{oauthInit} = require("../meet/oauthinit");
const{oauthCallback} = require("../meet/oauthcallback");

router.post("/schedule",scheduleMeeting);
router.post("/cancel",cancelMeeting);
router.get("/auth",oauthInit);
router.get("/oauth/callback",oauthCallback)
module.exports = router;