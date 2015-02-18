var _ = require('underscore');
var centros = require('./cenjubmap.js'); 
var activities = require('./leerActividades');
var csv = require('csv');
var fs = require('fs'); 

require('string-format').extend(String.prototype);

var found = -1, notFound = 0;

centros.getMap(function(centros) {
	function findCentro(data) {
		var rnejyp = data.rnejyp.replace(/-| |:|\./g, "");
		var centro = centros.byid[rnejyp];

		if (!centro && rnejyp) {
			centro = centros.byid["0" + rnejyp];
		}
		if (!centro) {
			data.cenjub = centros.limpiarNombre(data.cenjub.toUpperCase())
			centro = centros.byname[data.cenjub];
		}

		return centro;
	}

	var columns = ['nombre_a','calle','numero','localidad','partido','provincia','codpostal',
			'distrito','edificio','piso','dpto','barrio','fax']; 

	function header(data) {
		return _.extend(data, _.object(columns, columns));
	}

	var addDataCentro = csv.transform(function(data) {
		if (found < 0) {
			found++;
			return(header(data));
		}

		var centro = findCentro(data);
		if(!centro) return null;

		_.extend(data, _.pick(centro, columns));

		return data;
	})

	activities.read()
		.pipe(addDataCentro)
		.pipe(csv.stringify())
		.pipe(fs.createWriteStream('./output/actividadesConCentros.csv'));
});
