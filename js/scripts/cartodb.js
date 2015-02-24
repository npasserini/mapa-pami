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

function queryCartoDB(query, callback) {
  var client = new CartoDB(config);

  client.on('connect', function() {
    debug(query);
    client.query(query, {});
  });

  client.pipe(es.parse()).on('data', function(data) {
    callback(data);
  });

  client.on('error', function(errr) {
    debug("ERROR! ", err);
  })

  client.connect();
}

function pipeCartoDB(query, stream) {
  queryCartoDB(query, function(data) {
    debug("Data received..."); 
    rows = es.readArray(data.rows);
    semaphore.stream = rows;
    rows.pipe(stream);
  })
}

function lookupGeom(row, callback) {
  semaphore.wait();

  row.provincia = nombreProv(row.provincia);
  var nominatimQuery = '{calle} {numero}, {localidad}, {partido}, {provincia}, Argentina'.format(row);

  var nominatimUrl = 'http://nominatim.openstreetmap.org/search/{query}?format=json'.format({
    query: encodeURIComponent(nominatimQuery)
  });

  request.get(nominatimUrl, function(err, res) {
    function error(status) {
      callback({cartodb_id: row.cartodb_id, status: status, query: nominatimQuery}); 
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
}

function updateRow(data) {
  if (!data.geom) data.geom = "null";

  var updateQuery = "update {table} set the_geom={data.geom}, status={data.status} where cartodb_id={data.cartodb_id}".format({
    table: config.table,
    data: data,
  });

  semaphore.signal();

  queryCartoDB(updateQuery, function(res) {
    debug("Updated {res.total_rows} row, cartodb_id: {data.cartodb_id}, status: {data.status}".format({
      data: data,
      res: res
    }));
  });
}

var semaphore = {
  currentQueries: 0,
  maxQueries: 3,
  wait: function() {
    debug("wait: ", ++this.currentQueries);

  },
  signal: function() {
    debug("signal: ", --this.currentQueries);
  }
}

var query = "select {fields} from {table} where status = 0 limit 10".format({
  fields: 'cartodb_id, ST_AsGeoJSON(the_geom), calle, numero, localidad, partido, provincia',
  table: config.table
});

var lookupGeomStream = es.map(lookupGeom);
lookupGeomStream.on('error', updateRow);
lookupGeomStream.on('data', updateRow)

pipeCartoDB(query, lookupGeomStream);
