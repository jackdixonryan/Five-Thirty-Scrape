// Importing dependencies
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const path = require('path');
const PORT = process.env.PORT || 3500;
const app = express();
// The latter may need to be amended--just a cautiom
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/mongoHeadlines';

// Configuring imports
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'));

// Connecting to the DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

const db = require('./models');

app.get('/538', (req, result) => {
  // db.Article.remove().then(deletion => {
  //   console.log('deleted.');
  // });
  request('https://fivethirtyeight.com/sports/', (err, res, body) => {
    let articles = [];
    if (err) console.error(err);
    console.log('Status Code:', res && res.statusCode);
    const $ = cheerio.load(body);
    // Running Cheerio through the 538 sports section to pick out the top hits on the feed. 
    $(".fte_features").each(function(i, elem) {
      let article = {};
      article.title = $(this)
        .children('.post-info')
        .children('.tease-meta')
        .children('.tease-meta-content')
        .children('h2')
        .text()
        .trim();
      article.link = $(this)
        .children('.post-info')
        .children('.tease-meta')
        .children('.tease-meta-content')
        .children('h2')
        .children('a')
        .attr('href')
      article.author = $(this)
        .children('.post-info')
        .children('.tease-meta')
        .children('.tease-meta-content')
        .children('p')
        .children('.author')
        .text()
        .trim()
      article.image = $(this)
        .children('a')
        .children('img')
        .attr('src')
      if (article.author !== "") {
        articles.push(article);
        db.Article.create(article)
          .then(dbArticle => {
            console.log("Successfully added.");
          })
          .catch(err => {
            console.warn('You are probably attempting to add a duplicate key. Please carry on.');
          });
        }
    });
    let finalRes = db.Article.find({})
      .then(finalRes => {
        result.send("scrape complete.");
      })
      .catch(err => {
        return result.json(err);
      })
  });
});

// Since nested requests was a bust, here we're hitting a different URI on our server and the link on 538 simultaneously to add to the db that way. Content doesn't exist for the article until this URI is pinged.
app.get('/search/:articleid', (req, result) => {
  let id = req.params.articleid;
  db.Article.findById(id, (err, resArt) => {
    if (err) console.error(err);
    let contents = [];
    request(resArt.link, (error, res, body) => {
      if (error) console.error(error);
      let $ = cheerio.load(body);
      $('.single-post-content').each(function(i, elem) {
        let content = $(this)
          .children('p')
          .text()
          .trim();
        contents.push(content);
      });
      result.json(contents);
      db.Article.findOneAndUpdate(
        { _id: req.params.articleid },
        { content: contents },
        { new: false })
        .then(resultant => {
          console.log('Successfully updated this entry.');
        });
    });
  });
});

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get('/', (req, res) => {
  db.Article.find({})
    .then(data => {
      let obj = {
        data: data
      };
      res.render('index', obj);
    })
});

app.get("/articles", (req, res) => {
  db.Article.find({})
    .then(dbArticle => {
      res.json(dbArticle)
    })
    .catch(err => {
      res.json(err);
    })
});

app.get('/articles/:articleID', (req, res) => {
  db.Article.find({
    _id: req.params.articleID
  })
  .populate('comment')
  .then(dbArticle => {
    res.json(dbArticle)
  })
  .catch(err => {
    res.json(err);
  });
});

app.post('/articles/:articleID', (req, res) => {
  db.Comment.create(req.body)
    .then(dbComment => {
      return db.Article.findOneAndUpdate({ _id: req.params.articleID }, {comment: dbComment._id });
    })
    .then(dbArticle => {
      res.json(dbArticle);
    })
    .catch(err => {
      res.json(err);
    });
});

app.listen(PORT, () => {
  console.log('Express running on PORT', PORT);
});
