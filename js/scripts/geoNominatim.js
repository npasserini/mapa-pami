var request = require('superagent');
var geoCodeBase = require('./geoCodeBase.js');

function NominatimGeoCoder(debug) {
  this.lookupGeom = function(row, callback) {
    var query = this.createQuery(row);
    debug("Id: {0}, query = {1}".format(row.cartodb_id, query));

    var nominatimUrl = 'http://nominatim.openstreetmap.org/search/{query}?format=json'.format({
      query: encodeURIComponent(query)
    });
    debug(nominatimUrl);

    request.get(nominatimUrl, function(err, res) {
      function error(status) {
        callback({cartodb_id: row.cartodb_id, status: status, query: query}); 
      }

      if (err) error(0); // Se deja el status en 0 => reintentar
      else if(res.status != 200) error(res.status);
      else if(res.body.length == 0) error(-1);
      else {
        var newData = {
          cartodb_id: row.cartodb_id,
          status: 200,
          geom: geom(res.body[0])
        }

        debug(newData);
        callback(null, newData);
      }
    });
  };
}

NominatimGeoCoder.prototype = geoCodeBase;
module.exports = NominatimGeoCoder;
