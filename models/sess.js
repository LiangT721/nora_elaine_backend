const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SessSchema = new Schema({
  sess:{ type: String, required: true},
  expiry_date:{ type: String, required: true},
  username: { type:mongoose.Types.ObjectId, required: true, ref:'User'},
});

module.exports = mongoose.model('Sess', SessSchema);