/**
* The schema and model for carrier data
*/
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var carrierSchema = new mongoose.Schema({
	id: Number,
	name: String
});

exports.def =  
	{
		"Carrier":{
			"id":"Carrier",
			"required": ["id", "name"],
			"properties":{
				"id":{
					"type":"integer",
					"format": "int64",
					"description": "Carrier unique identifier",
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

exports.model = mongoose.model('carriers', carrierSchema);