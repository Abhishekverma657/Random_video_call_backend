



const User = require('./models/User');

let queue = [];
let activeCalls = {};
let recentSkips = {}; // { uid: [{peerUid, timestamp}] }

function canMatch(uid1, uid2) {
  const now = Date.now();
  if (!recentSkips[uid1]) recentSkips[uid1] = [];
  if (!recentSkips[uid2]) recentSkips[uid2] = [];
  // Remove old entries (older than 1 min)
  recentSkips[uid1] = recentSkips[uid1].filter(m => now - m.timestamp < 60 * 1000);
  recentSkips[uid2] = recentSkips[uid2].filter(m => now - m.timestamp < 60 * 1000);
  // Check if matched/skipped in last 1 min
  return !recentSkips[uid1].some(m => m.peerUid === uid2);
}

function socketHandler(io) {
  io.on('connection', (socket) => {
    // User joins queue\\
    socket.on('joinQueue', async ({ uid, gender, country }) => {
      try {
        const user = await User.findOne({ uid });
        if (!user) return;
        user.socketId = socket.id;
        user.isOnline = true;
        // if (gender) user.gender = gender;
        // if (country) user.country = country;
        await user.save();
        console.log('joinQueue:', {
          uid,
          gender,
          country,
          userGender: user.gender,
          userCountry: user.country
        });



        // Remove from queue if already present
        queue = queue.filter(u => u.uid !== user.uid);
        if (user.timeout) clearTimeout(user.timeout);

        // Add to queue with gender/country filters
        const queuedUser = {
          ...user.toObject(),
          socketId: socket.id,
          filterGender: gender || 'both', // User wants to match with this gender
          filterCountry: (!country || country === 'Global') ? '' : country, // User wants to match with this country
          timeout: setTimeout(() => {
            queue = queue.filter(u => u.uid !== user.uid);
            io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
            console.log(`[TIMEOUT] No match found for ${user.uid} (${user.gender}, ${user.country}) with filterGender=${gender || 'both'}, filterCountry=${(!country || country === 'Global') ? 'Global' : country}`);
          }, 60 * 1000) // 1 minute timeout
        };
        queue.push(queuedUser);

        console.log(`[QUEUE JOIN] ${user.uid} joined queue with filterGender=${queuedUser.filterGender}, filterCountry=${queuedUser.filterCountry || 'Global'}`);
        console.log('Current Queue:', queue.map(u => ({
          uid: u.uid,
          gender: u.gender,
          country: u.country,
          filterGender: u.filterGender,
          filterCountry: u.filterCountry
        })));
        tryToMatch(io);








      } catch (err) {
        console.error('joinQueue error:', err.message);
      }
    });








    // Skip/Next or End Call
    socket.on('call-ended', async ({ to }) => {
      // Notify peer
      io.to(to).emit('call-ended', { message: 'Peer skipped/disconnected' });
      // Remove both from activeCalls
      if (activeCalls[socket.id]) delete activeCalls[socket.id];
      if (activeCalls[to]) delete activeCalls[to];

      // Save recent skip for both users
      const now = Date.now();
      const user = await User.findOne({ socketId: socket.id });
      const peerUser = await User.findOne({ socketId: to });
      if (user && peerUser) {
        if (!recentSkips[user.uid]) recentSkips[user.uid] = [];
        if (!recentSkips[peerUser.uid]) recentSkips[peerUser.uid] = [];
        recentSkips[user.uid].push({ peerUid: peerUser.uid, timestamp: now });
        recentSkips[peerUser.uid].push({ peerUid: user.uid, timestamp: now });
      }

      // Peer ko queue me wapas daalo (searching pe bhejo)
      if (peerUser) {
        queue = queue.filter(u => u.uid !== peerUser.uid);
        if (peerUser.timeout) clearTimeout(peerUser.timeout);
        queue.push({
          ...peerUser.toObject(),
          socketId: to,
          timeout: setTimeout(() => {
            queue = queue.filter(u => u.uid !== peerUser.uid);
            io.to(to).emit('noMatchFound', { message: '❌ No match found in  5 sec' });
          }, 5 * 1000)
        });
        tryToMatch(io);
      }
      // User khud bhi searching pe jayega
      if (user) {
        queue = queue.filter(u => u.uid !== user.uid);
        if (user.timeout) clearTimeout(user.timeout);
        queue.push({
          ...user.toObject(),
          socketId: socket.id,
          timeout: setTimeout(() => {
            queue = queue.filter(u => u.uid !== user.uid);
            io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 5 sec' });
          }, 5 * 1000)
        });
        tryToMatch(io);
      }
    });

    // User disconnects
    socket.on('disconnect', async () => {
      try {
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
          user.isOnline = false;
          user.socketId = '';
          await user.save();
          const u = queue.find(u => u.uid === user.uid);
          if (u && u.timeout) clearTimeout(u.timeout);
          queue = queue.filter(u => u.uid !== user.uid);
        }
        // End active call if any
        if (activeCalls[socket.id]) {
          const peerSocketId = activeCalls[socket.id];
          io.to(peerSocketId).emit('call-ended', { message: 'Peer disconnected' });
          delete activeCalls[peerSocketId];
          delete activeCalls[socket.id];
        }
      } catch (err) {
        console.error('disconnect error:', err.message);
      }
    });

    // WebRTC signaling
    socket.on('signal', ({ to, data }) => {
      io.to(to).emit('signal', { from: socket.id, data });
    });
  });
}








function tryToMatch(io) {
  while (queue.length > 1) {
    // Always pick the first user in queue
    const user1 = queue[0];

    // Find a user2 that matches user1's filters AND user2's filters
    let idx = queue.findIndex((u, i) => {
      if (i === 0) return false; // skip user1 itself

      // user1 wants to match with u
      const genderMatch1 =
        (user1.filterGender.toLowerCase() === 'both' ||
          u.gender.toLowerCase() === 'both' ||
          user1.filterGender.toLowerCase() === u.gender.toLowerCase());

      const countryMatch1 =
        (!user1.filterCountry || !u.country ||
          user1.filterCountry.toLowerCase() === '' ||
          u.country.toLowerCase() === '' ||
          user1.filterCountry.toLowerCase() === u.country.toLowerCase());

      // u wants to match with user1
      const genderMatch2 =
        (u.filterGender.toLowerCase() === 'both' ||
          user1.gender.toLowerCase() === 'both' ||
          u.filterGender.toLowerCase() === user1.gender.toLowerCase());

      const countryMatch2 =
        (!u.filterCountry || !user1.country ||
          u.filterCountry.toLowerCase() === '' ||
          user1.country.toLowerCase() === '' ||
          u.filterCountry.toLowerCase() === user1.country.toLowerCase());

      // Recent skip check
      const canBeMatched = genderMatch1 && countryMatch1 && genderMatch2 && countryMatch2 && canMatch(user1.uid, u.uid);

      // Log every attempt
      console.log(`[MATCH ATTEMPT] ${user1.uid} (${user1.gender}, ${user1.country}) [wants: ${user1.filterGender}, ${user1.filterCountry || 'Global'}] <--> ${u.uid} (${u.gender}, ${u.country}) [wants: ${u.filterGender}, ${u.filterCountry || 'Global'}] => ${canBeMatched ? 'MATCH' : 'NO MATCH'}`);

      return canBeMatched;
    });

    if (idx === -1) {
      console.log(`[NO MATCH] No suitable match found for ${user1.uid} (${user1.gender}, ${user1.country}) with filterGender=${user1.filterGender}, filterCountry=${user1.filterCountry || 'Global'}`);
      break;
    }

    const user2 = queue[idx];
    queue = queue.filter(u => u.uid !== user1.uid && u.uid !== user2.uid);

    clearTimeout(user1.timeout);
    clearTimeout(user2.timeout);

    const roomId = `${user1.uid}_${user2.uid}`;
    activeCalls[user1.socketId] = user2.socketId;
    activeCalls[user2.socketId] = user1.socketId;

    // Log the match
    console.log(`[MATCHED] ${user1.uid} (${user1.gender}, ${user1.country}) <--> ${user2.uid} (${user2.gender}, ${user2.country}) | Room: ${roomId}`);

    io.to(user1.socketId).emit('matched', {
      roomId,
      peerSocketId: user2.socketId,
      peerUid: user2.uid,
      isOfferer: true,
      remoteName: user2.name,
      remoteCountry: user2.country || '',
    });

    io.to(user2.socketId).emit('matched', {
      roomId,
      peerSocketId: user1.socketId,
      peerUid: user1.uid,
      isOfferer: false,
      remoteName: user1.name,
      remoteCountry: user1.country || ''
    });
  }
}
 

module.exports = socketHandler;