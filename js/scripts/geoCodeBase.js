require('string-format').extend(String.prototype);

module.exports = {
	geom: function(geometry) {
	  return "ST_GeomFromText('POINT({lat} {lon})', 4326)".format(geometry);
	},

	nombreProv: function(id) {
	  var provincias = ['Capital Federal', 'Buenos Aires', 'Catamarca', 'Córdoba', 'Corrientes', 'Chaco', 'Chubut', 
	    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 
	    'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

	  return provincias[id - 1];
	},

	createQuery: function(address) {
	  address.nombreProv = this.nombreProv(address.provincia);
	  var query = '{calle} {numero}, {localidad}, {partido}, {nombreProv}, Argentina'.format(address);

	  return query;
	}
}

