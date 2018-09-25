const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  author: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  image: {
    type: String
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }
});

const Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;