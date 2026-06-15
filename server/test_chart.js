const mongoose = require('mongoose');
const MoodEntry = require('./models/MoodEntry');
mongoose.connect('mongodb://localhost:27017/emocare')
  .then(async () => {
    const userId = new mongoose.Types.ObjectId('6a2b0207e20c4597a97a072a');
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    
    const dailyMoods = await MoodEntry.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sevenDaysAgo },
          score: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    console.log("Daily Moods:");
    console.log(JSON.stringify(dailyMoods, null, 2));

    const moodMap = {};
    dailyMoods.forEach((entry) => {
      const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}-${String(entry._id.day).padStart(2, '0')}`;
      moodMap[key] = Math.round(entry.avgScore * 10) / 10;
    });

    const chartData = [];
    const formatDate = (date) => date.toISOString().split('T')[0];
    const getDayName = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = formatDate(date);
      chartData.push({
        day: getDayName(date),
        date: dateKey,
        avgScore: moodMap[dateKey] || 0,
      });
    }

    console.log("Chart Data:");
    console.log(JSON.stringify(chartData, null, 2));
    process.exit(0);
  });
