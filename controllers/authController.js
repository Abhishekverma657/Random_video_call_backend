const jwt = require('jsonwebtoken');
const User = require('../models/User');
const  admin  = require('../config/firebase');

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log("Received ID Token:", idToken);

    if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
      console.log("Invalid token format:", idToken);
      return res.status(400).json({ message: "Invalid token format" });
    }

    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Token:", decodedToken);

    const { uid, email, name, picture ,  } = decodedToken;

    
    let user = await User.findOne({ googleId: uid });

    if (!user) {
      user = new User({
        googleId: uid,
          uid: uid,  
        email: email,
        name: name || "No Name",
        photo: picture,
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        
        photo: user.photo,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid Token", error });
  }
};

exports.updateGenderAgeCountry = async (req, res) => {
  try {
    const { gender, age,country } = req.body;
    const userId = req.user.id;  

    if (!gender || !age) {
      return res.status(400).json({ message: "gender and age are required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { gender, age,country },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        gender: user.gender,
        age: user.age,
        country: user.country,

        plusMembership: user.plusMembership
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId).select('-password');  

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user._id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        photo: user.photo,
        age: user.age,
        gender: user.gender,
        country:user.country,
      
        isBlocked: user.isBlocked,
        plusMembership: user.plusMembership,
        
       
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }


};
 

const PLAN_DURATIONS = {
  weekly_plan: 7,
  fifteen_day_plan: 15,
  monthly_plan: 30
};

 
exports.updateVipInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { purchasedAt, planName } = req.body;

    const duration = PLAN_DURATIONS[planName];
    if (!duration) {
      return res.status(400).json({ message: "Invalid plan name" });
    }

    const purchasedDate = new Date(purchasedAt);
    const expiresAt = new Date(purchasedDate);
    expiresAt.setDate(expiresAt.getDate() + duration);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        vipInfo: {
          purchasedAt: purchasedDate,
          expiresAt,
          
          planName
        },
        plusMembership: true
      },
      { new: true }
    );

    res.json({
      success: true,
      vipInfo: updatedUser.vipInfo,
      plusMembership: updatedUser.plusMembership
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

 
exports.getVipInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("vipInfo plusMembership");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, vipInfo: user.vipInfo, plusMembership: user.plusMembership });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


 