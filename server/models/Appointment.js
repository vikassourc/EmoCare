const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  therapistId: {
    type: String,
    required: true
  },
  therapistName: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
