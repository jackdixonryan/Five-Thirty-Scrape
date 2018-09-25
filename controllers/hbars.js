const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  db.Articles.find({})
    .then(data => {
      let obj = {
        data: data
      }
    })
    .catch(err => {
      res.json(err);
    });
});

module.exports = router;