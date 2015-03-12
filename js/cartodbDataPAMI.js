var fetchLocations = function(filter, subtipos, bounds, config, callback) {
  'use strict';

  var filterByBounds = function(bounds) {
    if (!bounds) return '';

    var margin = (bounds.getNorthEast().lat - bounds.getSouthWest().lat) / 5;

    var topLeft = (bounds.getNorthWest().lng - margin) + ' ' + (bounds.getNorthWest().lat + margin);
    var bottomRight = (bounds.getSouthEast().lng + margin) + ' ' + (bounds.getSouthEast().lat - margin);

    var condition = "ST_Within(the_geom, ST_Envelope(ST_GeomFromText('LINESTRING( #topLeft#, #bottomRight# )', 4326)))"
      .replace('#topLeft#', topLeft)
      .replace('#bottomRight#', bottomRight);

    return condition;
  };

  if (!config) throw new Error('cartoDB config not specified');

  var debug = config.debug || false

  filter = (filter || '').toLowerCase();

  subtipos = subtipos || [];

  var fields =
    'taller, nombre_a, nombre_efector_comunitario, ' +
    'calle, numero, piso, dpto, ' +
    'barrio, partido, localidad, provincia, ' +
    'lat, lon'
  ;

  var query = 'select ' + fields + ' from ' + config.table;

  var conditions = [];

  var boundQuery = filterByBounds(bounds);
  if (boundQuery) conditions.push(boundQuery);

  if (filter) {
    var filterQuery =
      "lower(nombre) like '%" + filter + "%' or " +
      "lower(direccion) like '%" + filter + "%'";
    conditions.push(filterQuery);
  };

  conditions.push("lat is not null")

  if (conditions.length > 0) {
    query += ' where (' + conditions.join(') and (') + ')';
  }

  if (debug) console.log(query);

  var url = 'http://' + config.user + '.cartodb.com/api/v2/sql?' +
    'q=' + encodeURIComponent(query) +
    (config.apikey ? '&api_key=' + config.apikey : '');

  if (debug) console.log(url);

  $.get(url, function(data) {
    if (debug) console.log('fetched: ' + data.total_rows);
    callback(data);
  });

  return;

};
