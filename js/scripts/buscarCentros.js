var csv = require('csv');
var fs = require('fs');
var csv2obj = require('./cvs2obj.js');

require('string-format').extend(String.prototype);

var input = fs.createReadStream('input/actividadesCompleto.csv');
var parser = csv.parse();

var cenjubMapping = function() {
	var allFields = 'nombre_a,calle,numero,localidad,partido,provincia,codpostal,delegacion,codigo,cons_as,tel_sede,sede,reunion,creacion,nro_inscri,socios,vencim,pers_jurid,p_mut,p_gre,pebp,otros,tram,pend,prop,ult_vis,distrito,nrodoc,edificio,piso,dpto,barrio,fax,e_mail,form_91584,nomina_soc,estatutos,acta_const,acta_autor,const_domi,expediente,noexiste,tipo_entid,f_inscripc,apellido,nombre_b,codigoauto,desde,hasta'.split(',');

	var mapping = {};

	allFields.forEach(function(field, index){
	  mapping[field] = index;
	});
	
	return mapping;	
}();

mapper = csv.transform(csv2obj(cenjubMapping));

input.pipe(parser).pipe(mapper).pipe(csv.stringify()).pipe(process.stdout);
