var csv = require('csv');
var fs = require('fs');
var tx = require('./transformers.js');
var _ = require('underscore');

require('string-format').extend(String.prototype);

module.exports = function(callback) {
	var input = fs.createReadStream('input/centrosViejaGeo.csv');
	var parser = csv.parse();

	var cenjubMapping = function() {
		var allFields = 'ID_CJYP,DESC_CJYP,DIRECCION,CODPOSTAL,TELEFONO,X,Y,AGENCIA_NEW,ID_LOCALIDAD,RESPONSABLE,PROBIENESTAR,ESTADO,COMISIONVIGENTE,ENFERMERIA,PEDICURIA,AUTOCUIDADO,RECREATIVA'.split(',');

		var mapping = {
			descripcion: 'DESC_CJYP',
			direccion: 'DIRECCION',
			cp: 'CODPOSTAL',
			telefono: 'TELEFONO',
			x: 'X',
			y: 'Y',
			responsable: 'RESPONSABLE',
		};

		_.each(mapping, function(value, key){
		  mapping[key] = allFields.indexOf(value);
		});
	
		return mapping;	
	}();

	var centros = {byname:{}, limpiarNombre: limpiarNombre};

	function limpiarNombre(nombre) {
		var regexps = [
			/CJYP/g,
			/C JYP/g, 
			/ DE CENTROS DE JUB\., PENS\. Y DE LA/g,
			/CENTRO DE JYP/g,
			/CTRO\. DE JYP/g, 
			/CTRO DE JYP/g,
			/C J Y P/g,
			/C\.J\.YP/g,
			/C\. J\.YP\./g,
			/CTRO\. DE JUBILADOS /g,
			/CENTRO DE JUBILADOS /g,
			/Y PENSIONADOS/g,
			/CTRO\. DE JUB\./g,
			/AJYP/g, 
			/3ª/g,
			/3RA/g,
			/TERCERA/g,
			/DE /g								
		];
		
		regexps.forEach(function(regexp) {
			nombre = nombre.replace(regexp, "");
		});

		return nombre.trim();
	}

	var counter = tx.counter();
	input.pipe(parser)
		.pipe(tx.csv2obj(cenjubMapping))
		.pipe(counter.on('end', function() { console.log(counter.count); }))
		.on('data', function (data) {
			centros.byname[limpiarNombre(data.descripcion)] = data;
			console.log(data);
		})
		.on('end', function() {
			callback(centros);
		});
}
