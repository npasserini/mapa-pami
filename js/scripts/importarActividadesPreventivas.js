// var actividades = Papa.parse('../../datasets/actividades.csv');

var csv = require('csv');
var fs = require('fs'); 
require('string-format').extend(String.prototype);

var input = fs.createReadStream('../../datasets/actividades.csv');
var parser = csv.parse();

var records = 0;
var mapped = 0;

parser
  .on('data', function (data) {
    records += 1;
    console.log("({0}, {1})".format(data[14], data[15]));
  })
  .on('end', function () {  // done
    console.log('We have read {} records.'.format(records));
  });


input.pipe(parser);