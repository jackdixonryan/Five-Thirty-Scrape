const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    required: true,
    type: String
  }, 
  author: {
    type: String,
    required: false
  }
});

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;