 

// const User = require('./models/User');

// let maleQueue = [];
// let femaleQueue = [];

 
// let activeCalls = {};

// function socketHandler(io) {
//   io.on('connection', (socket) => {
//     console.log('🔌 Socket connected:', socket.id);

//     // When a user joins the queue
//     socket.on('joinQueue', async ({ uid }) => {
//       try {
//         const user = await User.findOne({ uid });
//         console.log('User found:', user);

//         if (!user) return;

//         user.socketId = socket.id;
//         user.isOnline = true;
//         await user.save();

//         // Create user object with timeout
//         const queuedUser = {
//           ...user.toObject(),
//           socketId: socket.id,
//           timeout: setTimeout(() => {
//             // Remove user after 1 min if no match
//             if (user.gender === 'male') {
//               maleQueue = maleQueue.filter(u => u.uid !== user.uid);
//             } else {
//               femaleQueue = femaleQueue.filter(u => u.uid !== user.uid);
//             }

//             io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
//             console.log(`⏰ Timeout for: ${user.name}`);
//           }, 60 * 1000) // 1 minute
//         };

//         if (user.gender === 'Male') {
//           maleQueue.push(queuedUser);
//         } else {
//           femaleQueue.push(queuedUser);
//         }

//         tryToMatch(io);

//       } catch (err) {
//         console.error('⚠️ Error in joinQueue:', err.message);
//       }
//     });

//     // When a user disconnects
//     socket.on('disconnect', async () => {
//       console.log('❌ Disconnected:', socket.id);

//       try {
//         const user = await User.findOne({ socketId: socket.id });
//         if (user) {
//           user.isOnline = false;
//           user.socketId = '';
//           await user.save();

//           if (user.gender === 'Male') {
//             const u = maleQueue.find(u => u.uid === user.uid);
//             if (u && u.timeout) clearTimeout(u.timeout);
//             maleQueue = maleQueue.filter(u => u.uid !== user.uid);
//           } else {
//             const u = femaleQueue.find(u => u.uid === user.uid);
//             if (u && u.timeout) clearTimeout(u.timeout);
//             femaleQueue = femaleQueue.filter(u => u.uid !== user.uid);
//           }
//         }

         
//         if (activeCalls[socket.id]) {
//           const peerSocketId = activeCalls[socket.id];
//           io.to(peerSocketId).emit('call-ended', { message: 'Peer disconnected' });
//           // Remove both from activeCalls
//           delete activeCalls[peerSocketId];
//           delete activeCalls[socket.id];
//         }
//       } catch (err) {
//         console.error('⚠️ Error in disconnect:', err.message);
//       }
//     });

//     // WebRTC signaling
//     socket.on('signal', ({ to, data }) => {
//       io.to(to).emit('signal', { from: socket.id, data });
//     });
//   });
// }

// // Matching function
// function tryToMatch(io) {
//   while (maleQueue.length > 0 && femaleQueue.length > 0) {
//     const maleUser = maleQueue.shift();
//     const femaleUser = femaleQueue.shift();

//     clearTimeout(maleUser.timeout);
//     clearTimeout(femaleUser.timeout);

//     const roomId = `${maleUser.uid}_${femaleUser.uid}`;

//     // --- NEW: Save active call mapping ---
//     activeCalls[maleUser.socketId] = femaleUser.socketId;
//     activeCalls[femaleUser.socketId] = maleUser.socketId;

//     io.to(maleUser.socketId).emit('matched', {
//       roomId,
//       peerSocketId: femaleUser.socketId,
//       peerUid: femaleUser.uid,
//       isOfferer: true,
//     });

//     io.to(femaleUser.socketId).emit('matched', {
//       roomId,
//       peerSocketId: maleUser.socketId,
//       peerUid: maleUser.uid,
//       isOfferer: false,
//     });

//     console.log(`🎯 Matched: ${maleUser.name} <--> ${femaleUser.name}`);
//   }
// }

// module.exports = socketHandler;


const User = require('./models/User');

let queue = [];
let activeCalls = {};

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // When a user joins the queue
    socket.on('joinQueue', async ({ uid }) => {
      try {
        const user = await User.findOne({ uid });
        console.log('User found:', user);

        if (!user) return;

        user.socketId = socket.id;
        user.isOnline = true;
        await user.save();

        // Create user object with timeout
        const queuedUser = {
          ...user.toObject(),
          socketId: socket.id,
          timeout: setTimeout(() => {
            // Remove user after 1 min if no match
            queue = queue.filter(u => u.uid !== user.uid);
            io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
            console.log(`⏰ Timeout for: ${user.name}`);
          }, 60 * 1000) // 1 minute
        };

        queue.push(queuedUser);

        tryToMatch(io);

      } catch (err) {
        console.error('⚠️ Error in joinQueue:', err.message);
      }
    });

    // When a user disconnects
    socket.on('disconnect', async () => {
      console.log('❌ Disconnected:', socket.id);

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
          // Remove both from activeCalls
          delete activeCalls[peerSocketId];
          delete activeCalls[socket.id];
        }
      } catch (err) {
        console.error('⚠️ Error in disconnect:', err.message);
      }
    });

    // WebRTC signaling
    socket.on('signal', ({ to, data }) => {
      io.to(to).emit('signal', { from: socket.id, data });
    });
  });
}

// Matching function
function tryToMatch(io) {
  while (queue.length > 1) {
    const user1 = queue.shift();
    const user2 = queue.shift();

    clearTimeout(user1.timeout);
    clearTimeout(user2.timeout);

    const roomId = `${user1.uid}_${user2.uid}`;

    // Save active call mapping
    activeCalls[user1.socketId] = user2.socketId;
    activeCalls[user2.socketId] = user1.socketId;

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

    console.log(`🎯 Matched: ${user1.name} <--> ${user2.name}`);
  }
}

module.exports = socketHandler;