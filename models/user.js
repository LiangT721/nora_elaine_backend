const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username:{type: String, required: true},
  creator:{ type: String, required: true},
  password:{ type: String, required: true},
  birth:{ type: String, required: true},
  icon:{ type: String, required: true},
  intro:{ type: String, required: false},
  paintings:[{type: mongoose.Types.ObjectId, required:true, ref:"Painting"}]
});

module.exports = mongoose.model('User', UserSchema);