const fs = require('fs');
const url = require('url');
const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');
const imageDataURI = require('image-data-uri');
const crypto = require('crypto')
const LIMITS = ['1', '2', '3']
const RARITIES = ['N', 'R', 'SR', 'UR']
const http = require("http");

function getInputs(request) {
  var query = url.parse(request.url, true).query;
  var result = 400;

  if (typeof query.url === 'undefined') {
    console.log('Received undefined url');
  } else if (typeof query.limit !== 'undefined' && !LIMITS.includes(query.limit)) {
    console.log(`Received limit "${query.limit}" is not supported`);
  } else if (typeof query.rarity === 'undefined') {
    console.log('Received undefined rarity');
  } else if (!RARITIES.includes(query.rarity)) {
    console.log(`Received rarity "${query.rarity}" is not supported`);
  } else {
      result = {
        card: query.url,
        limit: query.limit || 'undefined',
        rarity: query.rarity
      };
      console.log(`Received inputs: ${JSON.stringify(result)}`)
  }

  return result;
}

function getHash(inputs) {
  var combined = `${inputs.card}_${inputs.limit}_${inputs.rarity}`;
  return crypto.createHash('sha1').update(combined).digest('hex');
}

function buildImage(inputs) {
  var images = [
    {src: inputs.card, x: 0, y: 40},
    {src: `img/${inputs.rarity}.png`, x: 261, y: 0}
  ];
  if (inputs.limit !== 'undefined') {
    images.push({src: `img/limited-${inputs.limit}.png`, x: 0, y: 40})
  }

  return mergeImages(images, {
      Canvas: Canvas,
      Image: Image,
      width: 421,
      height: 654
    })
}

function returnImage(path, response) {
  fs.readFile(path, function (err, content) {
        if (err) {
            response.writeHead(400, {'Content-type':'text/html'})
            console.log(err);
            response.end("Error while generating the image");
        } else {
            //specify the content type in the response will be an image
            response.writeHead(200,{'Content-type':'image/jpg'});
            response.end(content);
        }
    });
}

var app = function(request, response) {
  console.log('')
  // Extract url, limit and rarity from request
  inputs = getInputs(request);
  if (inputs === 400) {
    response.statusCode = inputs;
    response.end();
    return;
  }

  // Calculate hash using the 3
  var hash = getHash(inputs);

  // if hash not cached:
  var target = `data/${hash}.png`;
  if (!fs.existsSync(target)) {
    console.log('No cached build found, creating...')
    // make image
    buildImage(inputs)
    // then save to file
    .then(b64 => imageDataURI.outputFile(b64, target))
    // then cache file path with hash and return the file
    .then(filePath => returnImage(filePath, response))
    // or handle rejection
    .catch((err) => console.log(`An error occurred while generating a new image: ${err}`));
  } else {
    // else return file
    console.log('Returning cached result')
    returnImage(target, response);
  }
}

http.createServer(app).listen(80, function() {
  console.log('Server started');
});
