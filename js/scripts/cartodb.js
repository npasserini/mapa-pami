var _ = require('underscore');
var request = require('superagent');
var CartoDB = require('cartodb');
var es = require('event-stream');
var Iterator = require('./iterator.js')
require('string-format').extend(String.prototype);

var GeoCoder = require('./geoGoogleMaps.js');
// var GeoCoder = require('./geoNominatim.js');

var config = {
  user: 'nicopasserini',
  table: 'actividadesconcentros',
  api_key: 'cc36c820c088af10889651e90170f03522c4be32',
  debug: true,
  timeout: 1000
};

function debug() { console.log.apply(console, arguments); }

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
    debug("Data received, {} rows.".format(data.rows.length)); 
    rows = es.readArray(data.rows);
    rows.pipe(stream);
  })
}


function updateRow(data, callback) {
  if (!data.geom) data.geom = "null";

  if(data.status == 0) throw data;
  var updateQuery = "update {table} set the_geom={data.geom}, status={data.status} where cartodb_id={data.cartodb_id}".format({
    table: config.table,
    data: data,
  });

  queryCartoDB(updateQuery, function(res) {
    debug("Updated {res.total_rows} row, cartodb_id: {data.cartodb_id}, status: {data.status}".format({
      data: data,
      res: res
    }));

    if (callback) callback();
  });
}

// *************************************************
// ** Main Program
// *************************************************

var geoCoder = new GeoCoder(debug);

var query = "select {fields} from {table} where status < 0".format({
  fields: 'cartodb_id, ST_AsGeoJSON(the_geom), calle, numero, localidad, partido, provincia',
  table: config.table
});


queryCartoDB(query, function(data) {
  debug("Data received, {} rows.".format(data.rows.length)); 
  iterator = new Iterator(data.rows);

  processRow();

  function processRow() {
    if (iterator.hasNext()) {
      geoCoder.lookupGeom(iterator.next(), function(err, data) {
        updateRow(err ? err : data, function() { debug(); setTimeout(processRow, config.timeout); });
      });        
    }
    else {
      debug("Finished processing {} rows".format(data.rows.length));
    }
  }
})
