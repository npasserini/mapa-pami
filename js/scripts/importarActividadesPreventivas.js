// var actividades = Papa.parse('../../datasets/actividades.csv');

var csv = require('csv');
var fs = require('fs'); 
require('string-format').extend(String.prototype);

var input = fs.createReadStream('../../datasets/actividades.csv');
var parser = csv.parse();

var records = 0;
// using a readStream that we created already
parser
  .on('data', function (data) {
    records += 1;
  })
  .on('end', function () {  // done
    console.log('We have read ', records, ' records.');
  });


input.pipe(parser);