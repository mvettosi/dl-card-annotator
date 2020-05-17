const express = require('express');
const annotator = require('./../modules/annotator.js')
const {
  check,
  validationResult
} = require('express-validator');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Duel Links card annotator'
  });
});

router.post('/', [
  check('url').isURL(),
  check('rarity').isIn(annotator.RARITIES),
  check('limit').optional().isIn(annotator.LIMITS),
  check('fresh').optional().isBoolean()
], function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }

  // Set default values
  req.body.fresh = req.body.fresh || false

  annotator.annotate(req.body)
    .then(image => res.send({
      "url": `${req.protocol}://${req.headers.host}/${image}`
    }))
    .catch(err => {
      console.log(err);
      res.status(500).json({
        "error": err.message
      })
    });
});

module.exports = router;