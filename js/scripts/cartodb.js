var _ = require('underscore');
var request = require('superagent');
var CartoDB = require('cartodb');
var es = require('event-stream');
require('string-format').extend(String.prototype);

// var fetchLocations = function(filter, subtipos, bounds, callback, config) {

var config = {
  user: 'nicopasserini',
  table: 'actividadesconcentros',
  api_key: 'cc36c820c088af10889651e90170f03522c4be32',
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

// function cartodb(query, callback) {
//   debug(query);

//   var url = 'http://{config.user}.cartodb.com/api/v2/sql?q={query}&api_key={config.apikey}'.format({
//     query: encodeURIComponent(query),
//     config: config,
//   });
//   debug(url);

//   request.get(url, function(err, res) { if (err) throw err; else callback(res); });
// }

function queryCartoDB(query, stream) {
  var client = new CartoDB(config);

  client.on('connect', function() {
    client.query(query, {});
  });

  client.pipe(es.parse()).on('data', function(data) {
    debug("Data received..."); 
    es.readArray(data.rows).pipe(stream);
  });

  client.connect();
  debug("Connecting...");
}

function lookupGeom(row, callback) {
  row.provincia = nombreProv(row.provincia);
  var nominatimQuery = '{calle} {numero}, {localidad}, {partido}, {provincia}, Argentina'.format(row);

  var nominatimUrl = 'http://nominatim.openstreetmap.org/search/{query}?format=json'.format({
    query: encodeURIComponent(nominatimQuery)
  });

  debug(nominatimUrl);        
  request.get(nominatimUrl, function(err, res) {
    debug(nominatimQuery);

    if (err) {
      debug("Error de comunicación al procesar la fila {}, se debe reintentar", row.cartodb_id);
      callback(); 
    }
    else if(res.status != 200) {
      callback({cartodb_id: row.cartodb_id, status: res.status} );
    }
    else if(res.body.length == 0) {
      callback({cartodb_id: row.cartodb_id, status: -1} ); // No results
    }
    else {
      var newData = {
        cartodb_id: row.cartodb_id,
        geom: geom(res.body[0])
      }

      debug(newData);
      callback(null, newData);
    }

    //   var updateQuery = "update {table} set the_geom={geom}, status=200 where cartodb_id={row.cartodb_id}".format({
    //     row: row,
    //     geom: geom(res.body[0]),
    //     table: config.table
    //   });

    //   cartodb(updateQuery, function(res) {
    //     debug("Status: ", res.status);
    //     if(res.status != 200) debug(res.error);
    //   });
    // }

    // debug();
  });
}

var query = "select {fields} from {table} where status = 0".format({
  fields: 'cartodb_id, ST_AsGeoJSON(the_geom), calle, numero, localidad, partido, provincia',
  table: config.table
});

var lookupGeomStream = es.map(lookupGeom);
lookupGeomStream.on('error', function(err) { debug("No se obtuvo la dirección de ", err); });
// lookupGeomStream.on('data', debug);

queryCartoDB(query, lookupGeomStream);
