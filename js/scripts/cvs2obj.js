var _ = require('underscore');

module.exports = function(mapping) {
	return function(data) {
		var result = {};
		_.each(mapping, function(value, key){
		  result[key] = data[value];
		});

		return result;
	}	
}
