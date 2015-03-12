var gm = require('googlemaps');
var geoCodeBase = require('./geoCodeBase.js');
// var _ = require('underscore');

function GoogleMapsGeoCoder(debug) {
  this.geom = function(location) {
  	return this.__proto__.geom({lat: location.lat, lon: location.lng});
  };

  this.lookupGeom = function(address, callback) {
    var query = this.createQuery(address);
    debug("Id: {0}, query = {1}".format(address.cartodb_id, query));

		gm.geocode(query, function(err, data){
      function error(status) {
        callback({cartodb_id: address.cartodb_id, status: status, query: query}); 
      }

      if (err) {
      	console.log("Hubo un error", err);
      	error(0); // Se deja el status en 0 => reintentar
      }
      else if(data.results.length == 0) {
      	console.log("No se encontraron resultados", data);
      	error(-2); // Indica que GoogleMaps no lo pudo geocodificar
      }
      else {
      	console.log("Hay resultados!", data.results[0].geometry.location);
        var newData = {
          cartodb_id: address.cartodb_id,
          status: 200,
          geom: this.geom(data.results[0].geometry.location)
        }

        debug(newData);
        callback(null, newData);
      }
    }.bind(this));
  };
};

GoogleMapsGeoCoder.prototype = geoCodeBase;
module.exports = GoogleMapsGeoCoder;
