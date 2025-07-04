// cron/vipCron.js
const cron = require('node-cron');
const User = require('../models/User');

cron.schedule('0 * * * *', async () => {
  const now = new Date();
  const expiredUsers = await User.find({
    "vipInfo.expiresAt": { $lte: now },
    plusMembership: true
  });

  for (const user of expiredUsers) {
    user.plusMembership = false;
    await user.save();
  }

  console.log(`${expiredUsers.length} users VIP expired.`);
});
