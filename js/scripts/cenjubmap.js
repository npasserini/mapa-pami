var csv = require('csv');
var fs = require('fs');
var tx = require('./transformers.js');
var _ = require('underscore');

require('string-format').extend(String.prototype);

var cenjubMapping = function() {
	var allFields = 'nombre_a,calle,numero,localidad,partido,provincia,codpostal,delegacion,codigo,cons_as,tel_sede,sede,reunion,creacion,nro_inscri,socios,vencim,pers_jurid,p_mut,p_gre,pebp,otros,tram,pend,prop,ult_vis,distrito,nrodoc,edificio,piso,dpto,barrio,fax,e_mail,form_91584,nomina_soc,estatutos,acta_const,acta_autor,const_domi,expediente,noexiste,tipo_entid,f_inscripc,apellido,nombre_b,codigoauto,desde,hasta'.split(',');

	var mapping = {};

	allFields.forEach(function(field, index){
	  mapping[field] = index;
	});
	
	return mapping;	
}();

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

module.exports.limpiarNombre = limpiarNombre;

module.exports.stream = function() {
	var input = fs.createReadStream('input/cenjub.csv');
	var parser = csv.parse();	
	var mapper = tx.csv2obj(cenjubMapping);

	return input.pipe(parser).pipe(mapper);
};

module.exports.getMap = function(callback) {
	var centros = {byid:{}, byname:{}, limpiarNombre: limpiarNombre};

	this.stream().on('data', function (data) {
		centros.byid[data.nro_inscri] = data;
		centros.byname[limpiarNombre(data.nombre_a)] = data;
	})
	.on('end', function() {
		callback(centros);
	});

	return centros;
};
