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

	var centros = {};

	input.pipe(parser)
		.pipe(tx.csv2obj(cenjubMapping))
		.on('data', function (data) {
			centros[data.nro_inscri] = data;
		})
		.on('end', function() {
			callback(centros);
		});
}
