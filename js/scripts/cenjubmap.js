var csv = require('csv');
var fs = require('fs');
var tx = require('./transformers.js');
var _ = require('underscore');

require('string-format').extend(String.prototype);

module.exports = function(callback) {
	var input = fs.createReadStream('input/cenjub.csv');
	var parser = csv.parse();

	var cenjubMapping = function() {
		var allFields = 'nombre_a,calle,numero,localidad,partido,provincia,codpostal,delegacion,codigo,cons_as,tel_sede,sede,reunion,creacion,nro_inscri,socios,vencim,pers_jurid,p_mut,p_gre,pebp,otros,tram,pend,prop,ult_vis,distrito,nrodoc,edificio,piso,dpto,barrio,fax,e_mail,form_91584,nomina_soc,estatutos,acta_const,acta_autor,const_domi,expediente,noexiste,tipo_entid,f_inscripc,apellido,nombre_b,codigoauto,desde,hasta'.split(',');

		var mapping = {};

		allFields.forEach(function(field, index){
		  mapping[field] = index;
		});
		
		return mapping;	
	}();

	var centros = {byid:{}, byname:{}, limpiarNombre: limpiarNombre};

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

	input.pipe(parser)
		.pipe(tx.csv2obj(cenjubMapping))
		.on('data', function (data) {
			centros.byid[data.nro_inscri] = data;
			centros.byname[limpiarNombre(data.nombre_a)] = data;
		})
		.on('end', function() {
			callback(centros);
		});
}
