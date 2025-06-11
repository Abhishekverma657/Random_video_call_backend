const mongoose = require('mongoose');

const reportedSchema = new mongoose.Schema({
  reporterUid: { type: String, required: true },
  reportedUid: { type: String, required: true },
  reason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reported', reportedSchema);