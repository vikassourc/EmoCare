const mongoose = require('mongoose');
const ChatSession = require('./models/ChatSession');

mongoose.connect('mongodb://localhost:27017/emocare')
  .then(async () => {
    const sessions = await ChatSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId('6a2b0207e20c4597a97a072a') } },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          mood: 1,
          updatedAt: 1,
          isActive: 1,
          messageCount: { $size: '$messages' }
        }
      }
    ]);
    console.log(JSON.stringify(sessions.slice(0, 2), null, 2));
    process.exit(0);
  });
