var _ = require('underscore');
var csv = require('csv');

module.exports = {
	noop: function() {
		return csv.transform(function(data) { return data; } );
	},

	csv2obj: function(mapping) {
		return csv.transform(function(data) {
			var result = {};
			_.each(mapping, function(value, key){
			  result[key] = data[value];
			});

			return result;
		});
	},

	counter: function() {
		var result = this.noop().on('data', function() { result.count++; });
		result.count = 0;

		return result;
	}
}
