// models/User.js
const mongoose = require("mongoose"); 

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  uid: String,
  name: String,
  email: String,
  photo: String,
 
  isBlocked: { type: Boolean, default: false },
  
   gender: { type: String, default: null },  
  age: { type: Number, default: null },     
  plusMembership: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  socketId: { type: String, default: '' },
  country: { type: String, default: '' },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
