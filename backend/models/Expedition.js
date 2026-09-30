const mongoose = require('mongoose');

const ExpeditionSchema = new mongoose.Schema({
  vesselName: { type: String, required: true },
  route: { type: String, required: true },
  departureDate: { type: Date },
  arrivalDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'In Transit', 'Arrived'],
    default: 'Pending'
  },
  currentCoordinates: { type: [Number], default: [0, 0] }
});

module.exports = mongoose.model('Expedition', ExpeditionSchema);