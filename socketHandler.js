 

// // const User = require('./models/User');

// // let maleQueue = [];
// // let femaleQueue = [];

 
// // let activeCalls = {};

// // function socketHandler(io) {
// //   io.on('connection', (socket) => {
// //     console.log('🔌 Socket connected:', socket.id);

// //     // When a user joins the queue
// //     socket.on('joinQueue', async ({ uid }) => {
// //       try {
// //         const user = await User.findOne({ uid });
// //         console.log('User found:', user);

// //         if (!user) return;

// //         user.socketId = socket.id;
// //         user.isOnline = true;
// //         await user.save();

// //         // Create user object with timeout
// //         const queuedUser = {
// //           ...user.toObject(),
// //           socketId: socket.id,
// //           timeout: setTimeout(() => {
// //             // Remove user after 1 min if no match
// //             if (user.gender === 'male') {
// //               maleQueue = maleQueue.filter(u => u.uid !== user.uid);
// //             } else {
// //               femaleQueue = femaleQueue.filter(u => u.uid !== user.uid);
// //             }

// //             io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
// //             console.log(`⏰ Timeout for: ${user.name}`);
// //           }, 60 * 1000) // 1 minute
// //         };

// //         if (user.gender === 'Male') {
// //           maleQueue.push(queuedUser);
// //         } else {
// //           femaleQueue.push(queuedUser);
// //         }

// //         tryToMatch(io);

// //       } catch (err) {
// //         console.error('⚠️ Error in joinQueue:', err.message);
// //       }
// //     });

// //     // When a user disconnects
// //     socket.on('disconnect', async () => {
// //       console.log('❌ Disconnected:', socket.id);

// //       try {
// //         const user = await User.findOne({ socketId: socket.id });
// //         if (user) {
// //           user.isOnline = false;
// //           user.socketId = '';
// //           await user.save();

// //           if (user.gender === 'Male') {
// //             const u = maleQueue.find(u => u.uid === user.uid);
// //             if (u && u.timeout) clearTimeout(u.timeout);
// //             maleQueue = maleQueue.filter(u => u.uid !== user.uid);
// //           } else {
// //             const u = femaleQueue.find(u => u.uid === user.uid);
// //             if (u && u.timeout) clearTimeout(u.timeout);
// //             femaleQueue = femaleQueue.filter(u => u.uid !== user.uid);
// //           }
// //         }

         
// //         if (activeCalls[socket.id]) {
// //           const peerSocketId = activeCalls[socket.id];
// //           io.to(peerSocketId).emit('call-ended', { message: 'Peer disconnected' });
// //           // Remove both from activeCalls
// //           delete activeCalls[peerSocketId];
// //           delete activeCalls[socket.id];
// //         }
// //       } catch (err) {
// //         console.error('⚠️ Error in disconnect:', err.message);
// //       }
// //     });

// //     // WebRTC signaling
// //     socket.on('signal', ({ to, data }) => {
// //       io.to(to).emit('signal', { from: socket.id, data });
// //     });
// //   });
// // }

// // // Matching function
// // function tryToMatch(io) {
// //   while (maleQueue.length > 0 && femaleQueue.length > 0) {
// //     const maleUser = maleQueue.shift();
// //     const femaleUser = femaleQueue.shift();

// //     clearTimeout(maleUser.timeout);
// //     clearTimeout(femaleUser.timeout);

// //     const roomId = `${maleUser.uid}_${femaleUser.uid}`;

// //     // --- NEW: Save active call mapping ---
// //     activeCalls[maleUser.socketId] = femaleUser.socketId;
// //     activeCalls[femaleUser.socketId] = maleUser.socketId;

// //     io.to(maleUser.socketId).emit('matched', {
// //       roomId,
// //       peerSocketId: femaleUser.socketId,
// //       peerUid: femaleUser.uid,
// //       isOfferer: true,
// //     });

// //     io.to(femaleUser.socketId).emit('matched', {
// //       roomId,
// //       peerSocketId: maleUser.socketId,
// //       peerUid: maleUser.uid,
// //       isOfferer: false,
// //     });

// //     console.log(`🎯 Matched: ${maleUser.name} <--> ${femaleUser.name}`);
// //   }
// // }

// // module.exports = socketHandler;


// const User = require('./models/User');

// let queue = [];
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
//             queue = queue.filter(u => u.uid !== user.uid);
//             io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
//             console.log(`⏰ Timeout for: ${user.name}`);
//           }, 60 * 1000) // 1 minute
//         };

//         queue.push(queuedUser);

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

//           const u = queue.find(u => u.uid === user.uid);
//           if (u && u.timeout) clearTimeout(u.timeout);
//           queue = queue.filter(u => u.uid !== user.uid);
//         }

//         // End active call if any
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
//   while (queue.length > 1) {
//     const user1 = queue.shift();
//     const user2 = queue.shift();

//     clearTimeout(user1.timeout);
//     clearTimeout(user2.timeout);

//     const roomId = `${user1.uid}_${user2.uid}`;

//     // Save active call mapping
//     activeCalls[user1.socketId] = user2.socketId;
//     activeCalls[user2.socketId] = user1.socketId;

//     io.to(user1.socketId).emit('matched', {
//       roomId,
//       peerSocketId: user2.socketId,
//       peerUid: user2.uid,
//       isOfferer: true,
//        remoteName: user2.name,
//       remoteCountry: user2.country || '',
//     });

//     io.to(user2.socketId).emit('matched', {
//       roomId,
//       peerSocketId: user1.socketId,
//       peerUid: user1.uid,
//       isOfferer: false,
//        remoteName: user1.name,
//       remoteCountry: user1.country || ''
//     });

//     console.log(`🎯 Matched: ${user1.name} <--> ${user2.name}`);
//   }
// }

// module.exports = socketHandler;
const User = require('./models/User');

let queue = [];
let activeCalls = {};
let recentMatches = {}; // { uid: [uid1, uid2, ...] }

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // User joins queue
    socket.on('joinQueue', async ({ uid }) => {
      try {
        const user = await User.findOne({ uid });
        if (!user) return;

        user.socketId = socket.id;
        user.isOnline = true;
        await user.save();

        // Remove from queue if already present
        queue = queue.filter(u => u.uid !== user.uid);

        // Create user object with timeout
        const queuedUser = {
          ...user.toObject(),
          socketId: socket.id,
          timeout: setTimeout(() => {
            queue = queue.filter(u => u.uid !== user.uid);
            io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
            console.log(`⏰ Timeout for: ${user.name}`);
          }, 40 * 1000) // 1 minute
        };

        queue.push(queuedUser);

        tryToMatch(io);

      } catch (err) {
        console.error('⚠️ Error in joinQueue:', err.message);
      }
    });

    // Skip event
    socket.on('skip', async () => {
      try {
        const user = await User.findOne({ socketId: socket.id });
        if (!user) return;

        // End active call if any
        if (activeCalls[socket.id]) {
          const peerSocketId = activeCalls[socket.id];
          const peerUser = await User.findOne({ socketId: peerSocketId });

          // Add each other to recentMatches
          if (peerUser) {
            recentMatches[user.uid] = (recentMatches[user.uid] || []).concat(peerUser.uid);
            recentMatches[peerUser.uid] = (recentMatches[peerUser.uid] || []).concat(user.uid);

            // Remove after 5 min
            setTimeout(() => {
              recentMatches[user.uid] = (recentMatches[user.uid] || []).filter(u => u !== peerUser.uid);
              recentMatches[peerUser.uid] = (recentMatches[peerUser.uid] || []).filter(u => u !== user.uid);
            }, 5 * 60 * 1000);
          }

          // Remove both from activeCalls
          delete activeCalls[peerSocketId];
          delete activeCalls[socket.id];

          // Send both to searching state
          io.to(peerSocketId).emit('startSearching');
          io.to(socket.id).emit('startSearching');

          // Add both back to queue
          queue = queue.filter(u => u.uid !== user.uid && u.uid !== peerUser.uid);

          // Clear any old timeouts
          if (peerUser) {
            const qPeer = queue.find(u => u.uid === peerUser.uid);
            if (qPeer && qPeer.timeout) clearTimeout(qPeer.timeout);
          }
          const qUser = queue.find(u => u.uid === user.uid);
          if (qUser && qUser.timeout) clearTimeout(qUser.timeout);

          // Add both to queue with new timeout
          const queuedUser = {
            ...user.toObject(),
            socketId: socket.id,
            timeout: setTimeout(() => {
              queue = queue.filter(u => u.uid !== user.uid);
              io.to(socket.id).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
            }, 10 * 1000)
          };
          const queuedPeer = peerUser ? {
            ...peerUser.toObject(),
            socketId: peerSocketId,
            timeout: setTimeout(() => {
              queue = queue.filter(u => u.uid !== peerUser.uid);
              io.to(peerSocketId).emit('noMatchFound', { message: '❌ No match found in 1 minute' });
            }, 10 * 1000)
          } : null;

          queue.push(queuedUser);
          if (queuedPeer) queue.push(queuedPeer);

          tryToMatch(io);
        }
      } catch (err) {
        console.error('⚠️ Error in skip:', err.message);
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

// Matching function with recentMatches check
function tryToMatch(io) {
  while (queue.length > 1) {
    const user1 = queue.shift();
    const user2 = queue.shift();

    // Don't match if in recentMatches
    if (
      (recentMatches[user1.uid] || []).includes(user2.uid) ||
      (recentMatches[user2.uid] || []).includes(user1.uid)
    ) {
      // Put back and break (to avoid infinite loop)
      queue.push(user1, user2);
      break;
    }

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