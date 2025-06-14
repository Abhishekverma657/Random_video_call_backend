const express = require("express");
const router = express.Router();
const { googleLogin ,updateGenderAgeCountry ,getProfile    } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

 
router.post("/google-login", googleLogin);
router.post("/update-gender-age-country", auth, updateGenderAgeCountry);
router.get("/profile", auth, getProfile);
 
 

module.exports = router;