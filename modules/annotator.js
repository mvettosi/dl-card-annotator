const crypto = require('crypto')
const fs = require('fs');
const probe = require('probe-image-size');
const mergeImages = require('merge-images');
const {
  Canvas,
  Image
} = require('canvas');
const imageDataURI = require('image-data-uri');

const RARITY_WIDTH = 160
const RARITY_HEIGHT = 40
const LIMIT_WIDTH = 100
const LIMIT_HEIGHT = 100
const IMAGES_FOLDER = 'public/images'
const DATA_FOLDER = 'data'

function getHash(inputs) {
  var combined = `${inputs.url}_${inputs.limit}_${inputs.rarity}`;
  return crypto.createHash('sha1').update(combined).digest('hex');
}

function buildImage(cardSizes, inputs) {
  var images = [{
      src: inputs.url,
      x: 0,
      y: RARITY_HEIGHT
    },
    {
      src: `${IMAGES_FOLDER}/${inputs.rarity}.png`,
      x: cardSizes.width - RARITY_WIDTH,
      y: 0
    }
  ];
  if (typeof inputs.limit !== 'undefined') {
    images.push({
      src: `${IMAGES_FOLDER}/limited-${inputs.limit}.png`,
      x: 0,
      y: RARITY_HEIGHT
    })
  }

  return mergeImages(images, {
    Canvas: Canvas,
    Image: Image,
    width: cardSizes.width,
    height: cardSizes.height + RARITY_HEIGHT
  })
}

exports.RARITIES = ['N', 'R', 'SR', 'UR']
exports.LIMITS = ['0', '1', '2', '3']
exports.annotate = function(inputs) {
  return new Promise((resolve, reject) => {
    console.log('');
    console.log(inputs);

    // Calculate hash using the 3
    var hash = getHash(inputs);
    console.log(`Calculated hash: ${hash}`)

    // if hash not cached:
    var fileName = `${hash}.png`;
    var filePath = `${DATA_FOLDER}/${fileName}`;
    if (!fs.existsSync(filePath) || inputs.fresh) {
      if (inputs.fresh) {
        console.log('New image requested, re-creating...');
        fs.unlinkSync(filePath);
      } else {
        console.log('No cached build found, creating...');
      }
      // Get card sizes
      probe(inputs.url)
        // then make image
        .then(result => buildImage(result, inputs))
        // then save to file
        .then(b64 => imageDataURI.outputFile(b64, filePath))
        // then cache file path with hash and return the file
        .then(filePath => resolve(fileName));
    } else {
      // else return file
      console.log('Returning cached result');
      resolve(fileName);
    }
  });
}