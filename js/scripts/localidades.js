var csv = require('csv');
var _ = require('underscore');
var centros = require('./cenjubmap.js'); 
var actividades = require('./leerActividades');
var Levenshtein = require('levenshtein');

require('string-format').extend(String.prototype);

function buscarCoincidencias() {
	var procesarActividades = _.after(2, function() {
		console.log("locAct: ", _.size(locAct))
		console.log("locCen: ", _.size(locCen));

		locCen = _.keys(locCen).sort();
		locAct = _.keys(locAct).sort();

		found = _(locAct).countBy(function(loc) {
			if (_.contains(locCen, loc)) {
				return 'found'
			}
			else {

				parecidos = _(locCen).filter(function(test) {
					return new Levenshtein(loc, test).distance == 1;
				});

				if (parecidos.length == 1) {
					console.log("{0} se parece a {1}".format(loc, parecidos[0]));
					return 'mejorado';
				}

				// console.log("No tengo nada para {0}".format(loc));
				return 'notFound';
			}
		});

		console.log(found);

	});

	var locCen = {};
	centros.stream().on('data', function(data) {
		loc = limpiarNombreLocalidad(data.localidad.trim());

		current = locCen[loc];
		if (!current) current = 0;
		locCen[loc] = ++current;
	}).on('end', procesarActividades);

	var locAct = {};
	actividades.read().on('data', function(data) {
		loc = limpiarNombreLocalidad(data.localidad.trim());

		current = locAct[loc];
		if (!current) current = 0;
		locAct[loc] = ++current;
	}).on('end', procesarActividades);
}

function limpiarNombreLocalidad(loc) {
	return loc.replace(/^VA?[\. ]+/, "VILLA ")
		.replace(/Á/g, "A")
		.replace(/É/g, "E")
		.replace(/Í/g, "I")
		.replace(/Ó/g, "O")
		.replace(/Ú/g, "U");
}

function limpiarLocalidades() {
	var transformer = csv.transform(function (data) {
		data.localidad = limpiarNombreLocalidad(data.localidad);
	});	
}

buscarCoincidencias();
