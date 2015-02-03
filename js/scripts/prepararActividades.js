var csv = require('csv');
var fs = require('fs'); 
var _ = require('underscore');
var csv2obj = require('./cvs2obj.js');

require('string-format').extend(String.prototype);

var input = fs.createReadStream('input/actividadesCompleto.csv');
var parser = csv.parse();

var activitiesMapping = function() {
	var allFields = 'NRO ORDEN,UGL,AGENCIA,LOCALIDAD,NRO EXPEDIENTE,NOMBRE EFECTOR COMUNITARIO,RNEJyP,N° SAP,DENOM. PROYECTO,MODALIDAD APROBACIÓN / RENOVACIÓN,NRO DISPOSICIÓN  APROBACIÓN / ÚLTI MA RENOVACIÓN,CÓDIGO ACTIVIDAD 2013,CÓDIGO ACTIVIDAD 2014 MODIFICADO,TALLER,MES INICIO,MES FINALIZ,AFILIADOS PARTICIP. 2014,VARIACIÓN PARTIC,INSUMOS MENSUALES 2014,INSUMOS X UNICA VEZ 2014,REFRIG. SOCIAL MENSUAL 2014,USO INSTALAC. MENSUAL  2014,FREC SEM.,HS / ENC.,GRADO CAPAC,MONTO REC HUMANO 1. NO COMPLETAR,FREC SEM.,HS / ENC.,GRADO CAPAC,MONTO REC HUMANO 2. NO COMPLETAR,FREC SEM.,HS / ENC.,GRADO CAPAC,MONTO REC HUMANO 3. NO COMPLETAR,FREC SEM.,HS / ENC.,GRADO CAPAC,MONTO REC HUMANO 4. NO COMPLETAR,FREC SEM.,HS / ENC.,GRADO CAPAC,MONTO REC HUMANO AUX. NO COMPLETAR,MONTO MENSUAL PROYECTO,MONTO TOTAL MENSUAL (x Meses),MONTO X UNICA VEZ PROYECTO,MONTO TOTAL,"SE RENUEVA EL TALLER SI / NO",NRO DISPOSICION,ORIGEN,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,'.split(',');
	var mapping = {
		localidad: 'LOCALIDAD',
		cenjub: 'NOMBRE EFECTOR COMUNITARIO', 
		rnejyp: 'RNEJyP',
		codact: 'CÓDIGO ACTIVIDAD 2014 MODIFICADO',
		taller: 'TALLER'
	};

	_.each(mapping, function(value, key){
	  mapping[key] = allFields.indexOf(value);
	});
	
	return mapping;	
}();

var mapper = csv.transform(csv2obj(activitiesMapping));

// var records = 0;
// mapper
//   .on('data', function (data) {
//     records += 1;
//     console.log(data);
//   })
//   .on('end', function () {  // done
//     console.log('We have read ', records, ' records.');
//   });


input.pipe(parser).pipe(mapper).pipe(csv.stringify()).pipe(process.stdout);

