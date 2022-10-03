const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const paintingSchema = new Schema({
  // creator:{ type: String, required: true},
  user: { type:mongoose.Types.ObjectId, required: true, ref:'User'},
  creator:{ type: String, required: true},
  created_date:{ type: String, required: true},
  name:{ type: String, required: true},
  upload_date:{ type: String, required: true},
  category:{ type: String, required: true},
  content:{ type: String, required: true},
  image:{ type: String, required: true},
  imagePreview:{ type: String, required: true},
  key_word_1:{ type: String, required: false},
  key_word_2:{ type: String, required: false},
  key_word_3:{ type: String, required: false},
});

module.exports = mongoose.model('Painting', paintingSchema);

