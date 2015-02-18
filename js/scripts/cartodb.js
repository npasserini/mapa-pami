var _ = require('underscore');
var request = require('superagent');
require('string-format').extend(String.prototype);

// var fetchLocations = function(filter, subtipos, bounds, callback, config) {

var config = {
  user: 'nicopasserini',
  table: 'actividadesconcentros',
  debug: true
};

function debug() { console.log.apply(console, arguments); }

function geom(obj) {
  debug("Geom: ", obj);
  return "ST_GeomFromText('POINT({lat} {lon})', 4326)".format(obj);
}

function nombreProv(id) {
  var provincias = ['Capital Federal', 'Buenos Aires', 'Catamarca', 'Córdoba', 'Corrientes', 'Chaco', 'Chubut', 
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 
    'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

  return provincias[id - 1];
}

// http://nicopasserini.cartodb.com/api/v2/sql?q=select count(*) from actividadesconcentros where the_geom is null

var query = "select {fields} from {table} where the_geom is null".format({
// var query = "select {fields} from {table} where cartodb_id=6624".format({
  fields: 'cartodb_id, ST_AsGeoJSON(the_geom), calle, numero, localidad, partido, provincia',
  table: config.table
});
debug(query);

var url = 'http://{user}.cartodb.com/api/v2/sql?q={query}'.format({
  user: config.user,
  query: encodeURIComponent(query)
});
debug(url);
debug();

request.get(url, function(err, res) {
  if (err) throw err;
  if (!res.body.rows) {
    console.log(res.error.text);
  }
  else {
    _(res.body.rows).each(function(row) {
      row.provincia = nombreProv(row.provincia);
      if(!row.st_asgeojson) {
        var nominatimQuery = '{calle} {numero}, {localidad}, {partido}, {provincia}, Argentina'.format(row);

        var nominatimUrl = 'http://nominatim.openstreetmap.org/search/{query}?format=json'.format({
          query: encodeURIComponent(nominatimQuery)
        });

        request.get(nominatimUrl, function(err, res) {
          debug(nominatimQuery);
          debug(nominatimUrl);        

          if (err) throw err;
          else if(res.status != 200) {
            debug("Error: ", res.status);
          }
          else if(res.body.length == 0) {
            debug("No results");
          }
          else {
            var updateQuery = "update {table} set the_geom={geom} where cartodb_id={row.cartodb_id}".format({
              row: row,
              geom: geom(res.body[0]),
              table: config.table
            });
            debug(updateQuery);

            var updateUrl = 'http://{config.user}.cartodb.com/api/v2/sql?q={query}&api_key={apikey}'.format({
              query: encodeURIComponent(updateQuery),
              config: config,
              apikey: 'cc36c820c088af10889651e90170f03522c4be32' 
            });
            debug(updateUrl)

            request.get(updateUrl, function(err, res) {
              if (err) throw err;
              else {
                debug("Status: ", res.status);
                if(res.status != 200) debug(res.error);
              }
            });
          }

          debug();
        });
      }
    });

    // var position = JSON.parse(res.body.rows[0].st_asgeojson);
    // if (position) console.log("Position from CartoDB: ", position.coordinates);
  }
});





