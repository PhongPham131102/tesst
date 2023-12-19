const mongoose = require("mongoose");
const visitSchema = new mongoose.Schema({
	date: Date,
	count: Number
  });
  
  module.exports = mongoose.model('Visit', visitSchema);