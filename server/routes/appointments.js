const express = require('express');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Get all appointments for user
router.get('/', async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id }).sort({ date: 1, time: 1 });
    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
});

// Book new appointment
router.post('/', async (req, res, next) => {
  try {
    const { therapistId, therapistName, specialty, date, time } = req.body;
    
    if (!therapistName || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const appointment = await Appointment.create({
      userId: req.user.id,
      therapistId,
      therapistName,
      specialty,
      date,
      time
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
});

// Cancel appointment
router.delete('/:id', async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
