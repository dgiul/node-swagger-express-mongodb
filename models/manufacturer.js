/**
* The schema and model for carrier data
*/
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var manufacturerSchema = new mongoose.Schema({
	id: Number,
	name: String
});

exports.def =  
	{
		"Manufacturer":{
			"id":"Manufacturer",
			"required": ["id", "name"],
			"properties":{
				"id":{
					"type":"integer",
					"format": "int64",
					"description": "Manufacturer unique identifier",
					"minimum": "0.0",
					"maximum": "100.0"
				},
				"name":{
					"type":"string",
					"description": "Name of the category"
				}
			}
		}
	};

exports.model = mongoose.model('manufacturers', manufacturerSchema);