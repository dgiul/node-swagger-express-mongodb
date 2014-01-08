/**
* The schema and model for carrier data
*/
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var phoneSchema = new mongoose.Schema({
	id: Number,
	manufacturer: mongoose.Schema.ObjectId,
	carriers: Array,
	name: String,
	status: String
});

exports.def =  
	{
		"Phone":{
			"id":"Phone",
			"required": ["_id", "carriers", "manufacturer", "name", "status"],
			"properties":{
				"_id":{
					"type":"integer",
					"format": "int64",
					"description": "Phone unique identifier",
					"minimum": "1"
				},
				"carriers":{
					"type":"array",
					"description": "The carriers that offer this phone"
				},
				"manufacturer":{
					"type":"string",
					"description": "Name of which company makes this phone"
				},
				"name":{
					"type":"string",
					"description": "Name of the phone"
				},
				"status":{
					"type":"string",
					"description": "Availability status"
				}
			}
		}
	};

exports.model = mongoose.model('phones', phoneSchema);