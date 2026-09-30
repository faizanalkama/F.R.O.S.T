const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  fiscalYear: { type: String, required: true, unique: true },
  totalAllocated: { type: Number, default: 0 },
  allocations: [{
    category: { type: String },
    amountInCr: { type: Number }
  }]
});

module.exports = mongoose.model('Budget', BudgetSchema);
