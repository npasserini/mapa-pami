var _ = require('underscore');
var centros = require('./cenjubmap.js'); 
var activities = require('./leerActividades');

require('string-format').extend(String.prototype);

var found = 0, notFound = 0;

centros.map(function(centros) {
	console.log("Se encontraron {} centros". format(_.size(centros)));	
	activities.read().on('data', function(data) {
		var rnejyp = data.rnejyp.replace(/-| |:|\./g, "");
		var centro = centros.byid[rnejyp];
		if (!centro && rnejyp) {
			centro = centros.byid["0" + rnejyp];
		}
		if (!centro) {
			data.cenjub = centros.limpiarNombre(data.cenjub.toUpperCase())
			centro = centros.byname[data.cenjub];
		}
		if (centro) found++; else {
			notFound++;
			console.log("No se pudo encontrar el centro de jubilados: \n",
				_.pick(data, 'rnejyp', 'cenjub', 'localidad'));
		}
	}).on('end', function() {
		var percentage = Math.round(found / (found+notFound) * 10000) / 100
		console.log("Se encontró el centro para {0} de {1} actividades ({2}% , {3} pendientes)."
			.format(found, found + notFound, percentage, notFound));
	})
});
