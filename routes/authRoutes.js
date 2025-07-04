const express = require("express");
const router = express.Router();
const { googleLogin ,updateGenderAgeCountry ,getProfile , updateVipInfo ,getVipInfo    } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

 
router.post("/google-login", googleLogin);
router.post("/update-gender-age-country", auth, updateGenderAgeCountry);
router.get("/profile", auth, getProfile);

router.post("/vip-info", auth, updateVipInfo);
router.get("/vip-info", auth, getVipInfo);
 
 

module.exports = router;