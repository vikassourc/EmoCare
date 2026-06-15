const mongoose = require('mongoose');
const ChatSession = require('./models/ChatSession');

mongoose.connect('mongodb://localhost:27017/emocare')
  .then(async () => {
    try {
      const sessions = await ChatSession.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId('6a2b0207e20c4597a97a072a') } },
        { $project: { messageCount: { $size: '$messages' } } } 
      ]);
      console.log('Aggregate success! length:', sessions.length);
    } catch(e) {
      console.error('Aggregate failed!', e.message);
    }
    process.exit(0);
  });
