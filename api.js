/**
* All API methods and database connection info
*/
var mongoose = require('mongoose'),
	param = require("./Common/node/paramTypes.js"),
	sw = require("./Common/node/swagger.js"),
	swe = sw.errors,
	config = require('./config'),
	db = mongoose.connection;

db.on('error', console.error);
db.on('connecting', function () {
	console.log('Database connecting');
});
db.once('open', function() {
	console.log('Database connection established');
});
db.on('reconnected', function () {
	console.log('Database reconnected');
});

mongoose.connect(config.db_url, {server: {auto_reconnect: true}});


/**
* Load the model files
*/
var Carrier = require('./models/carrier.js');
var Manufacturer = require('./models/manufacturer.js');
var Phone = require('./models/phone.js');


/**
* All methods and the database connection info for the API
*
* Everything inside of "spec" is for the documentation that Swagger generates,
* everything in "actions" is the business end of things and that's where the
* actual work is done
*
* Inside of spec...
* 	@property path The path used to access the method
* 	@property notes A longer version of what the operation does (shows up in the 
* 		"Implementation Notes" part of a methods decription when the method is 
*		expanded on the documentation page)
* 	@property summary Short summary of what the operation does (shows up on the same line as
*		the "path" when the method is hidden on the documentation page)
* 	@property method The HTTP method used for the Operations
* 	@property parameters Inputs to the methods (can be a blank array if no inputs are needed)
* 	@property type The data type returned by the method. Can be void, a simple-type, a complex,
		or a container (more info at: https://github.com/wordnik/swagger-core/wiki/datatypes)
* 	@property items An array of the model definitions
* 	@property responseMessages Describes how messages from the method maps to the API logic
* 	@property errorResponses Describes how errors messages from the method maps to the API logic
* 	@property nickname Used to provide a shebang (#!) in the swagger-ui
*/

/**
* List methods
*/
exports.getAllCarriers = {
	'spec': {
		description : "List all phone carriers",
		path : "/carrier/list",
		method: "GET",
		summary : "List all phone carriers",
		notes : "Returns a list of all phone carriers",
		type : "Carrier",
		nickname : "getAllCarriers",
		produces : ["application/json"],
		parameters : [],
		responseMessages : [swe.invalid('carriers'), swe.notFound('carriers')]
	},
	'action': function (req,res) {
		Carrier.model.find(function(err, carriers) {
			if (err) return next(swe.invalid('carriers'))

			if (carriers) {
				res.send(carriers);
			} else {
				res.send(404, swe.notFound('carriers'));
			};
		});
	}
};

exports.getAllManufacturers = {
	'spec': {
		description : "List all phone manufacturers",
		path : "/manufacturer/list",
		method: "GET",
		summary : "List all phone manufacturers",
		notes : "Returns a list of all phone manufacturers",
		type : "Manufacturer",
		nickname : "getAllManufacturers",
		produces : ["application/json"],
		parameters : [],
		responseMessages : [swe.invalid('manufacturers'), swe.notFound('manufacturers')]
	},
	'action': function (req,res) {
		Manufacturer.model.find(function(err, manufacturers) {
			if (err) return next(swe.invalid('manufacturers'))

			if (manufacturers) {
				res.send(manufacturers);
			} else {
				res.send(404, new Error('manufacturers not found'));
			};
		});
	}
};

exports.getAllPhones = {
	'spec': {
		description : "List all phone models",
		path : "/phone/list",
		method: "GET",
		summary : "List all phone models",
		notes : "Returns a list of all phone models",
		type : "Phone",
		nickname : "getAllPhones",
		produces : ["application/json"],
		parameters : [],
		responseMessages : [swe.invalid('phones'), swe.notFound('phones')]
	},
	'action': function (req,res) {
		Phone.model.find(function(err, phones) {
			if (err) return next(swe.invalid('phones'))

			if (phones) {
				res.send(phones);
			} else {
				res.send(404, new Error('phones not found'));
			};
		});
	}
};

/**
* Get record by ID methods
*/
exports.getCarrierById = {
	'spec': {
		description : "Operations about carriers",
		path : "/carrier/{carrierId}",
		method: "GET",
		summary : "Find carrier by ID",
		notes : "Returns a carrier based on ID",
		type : "Carrier",
		nickname : "getCarrierById",
		produces : ["application/json"],
		parameters : [param.path("carrierId", "ID of the carrier to return", "string")],
		responseMessages : [swe.invalid('id'), swe.notFound('carrier')]
	},
	'action': function (req,res) {
		Carrier.model.findOne({_id: req.params.carrierId}, function(err, carrier) {
			if (err) return res.send(404, { error: 'invalid id' });

			if (carrier) {
				res.send(carrier);
			} else {
				res.send(404, new Error('carrier not found'));
			}
		});
	}
};

exports.getManufacturerById = {
	'spec': {
		description : "Operations about manufacturers",
		path : "/manufacturer/{manufId}",
		method: "GET",
		summary : "Find manufacturer by ID",
		notes : "Returns a manufacturer based on ID",
		type : "Manufacturer",
		nickname : "getManufacturerById",
		produces : ["application/json"],
		parameters : [param.path("manufId", "ID of the manufacturer to return", "string")],
		responseMessages : [swe.invalid('id'), swe.notFound('manufacturer')]
	},
	'action': function (req,res) {
		Manufacturer.model.findOne({_id: req.params.manufId}, function(err, manufacturer) {
			if (err) return res.send(404, { error: 'invalid id' });

			if (manufacturer) {
				res.send(manufacturer);
			} else {
				res.send(404, new Error('manufacturer not found'));
			}
		});
	}
};

exports.getPhoneById = {
	'spec': {
		description : "Operations about phones",
		path : "/phone/{phoneId}",
		method: "GET",
		summary : "Find phone by ID",
		notes : "Returns a phone based on ID",
		type : "Phone",
		nickname : "getPhoneById",
		produces : ["application/json"],
		parameters : [param.path("phoneId", "ID of the phone to return", "string")],
		responseMessages : [swe.invalid('id'), swe.notFound('phone')]
	},
	'action': function (req,res) {
		Phone.model.findOne({_id: req.params.phoneId}, function(err, phone) {
			if (err) return res.send(404, { error: 'invalid id' });

			if (phone) {
				res.send(phone);
			} else {
				res.send(404, new Error('phone not found'));
			}
		});
	}
};

/**
* Add/create methods
*/
exports.addCarrier = {
	'spec': {
		path : "/carrier",
		notes : "Adds a new carrier",
		summary : "Add a new carrier",
		method: "POST",
		parameters : [param.body("Carrier name", "JSON object representing the carrier to add", "Carrier")],
		responseMessages : [swe.invalid('input')],
		nickname : "addCarrier"
	},
	'action': function(req, res, next) {
		var body = req.body;
		if(!body || !body.name){
			throw swe.invalid('carrier name');
		} else {
			// Create the new document (database will be updated automatically)
			Carrier.model.create({ name: body.name }, function (err, name) {
				if (err) return res.send(500, { error: err });

				if (name) {
					res.send(name);
				} else {
					res.send(500, { error: 'carrier not added' });
				};
			});
		}
	}
};

exports.addManufacturer = {
	'spec': {
		path : "/manufacturer",
		notes : "Adds a new manufacturer",
		summary : "Add a new manufacturer",
		method: "POST",
		parameters : [param.body("Manufacturer name", "JSON object representing the manufacturer to add", "Manufacturer")],
		responseMessages : [swe.invalid('input')],
		nickname : "addManufacturer"
	},
	'action': function(req, res, next) {
		var body = req.body;
		if(!body || !body.name){
			throw swe.invalid('manufacturer name');
		} else {
			// Create the new document (database will be updated automatically)
			Manufacturer.model.create({ name: body.name }, function (err, name) {
				if (err) return res.send(500, { error: err });

				if (name) {
					res.send(name);
				} else {
					res.send(500, { error: 'manufacturer not added' });
				};
			});
		}
	}
};

exports.addPhone = {
	'spec': {
		path : "/phone",
		notes : "Adds a new phone",
		summary : "Add a new phone",
		method: "POST",
		parameters : [param.body("Phone name", "JSON object representing the phone to add", "Phone")],
		responseMessages : [swe.invalid('input')],
		nickname : "addPhone"
	},
	'action': function(req, res, next) {
		var body = req.body;
		if(!body || !body.name){
			throw swe.invalid('phone name');
		} else {
			// Create the new document (database will be updated automatically)
			Phone.model.create({ name: body.name }, function (err, name) {
				if (err) return res.send(500, { error: err });

				if (name) {
					res.send(name);
				} else {
					res.send(500, { error: 'phone not added' });
				};
			});
		}
	}
};

/**
* Update methods
*/
exports.updateCarrier = {
	'spec': {
		path : "/carrier",
		notes : "Update an existing carrier",
		summary : "Update an existing carrier",
		method: "PUT",
		//parameters : [param.body("Carrier ID", "Carrier ID to update", "Carrier"), param.body("Carrier name", "New carrier name", "Carrier")],
		parameters : [
			param.query("id", "Carrier ID to update", "string", true),
			param.query("name", "New carrier name to use", "string", true)
		],
		responseMessages : [swe.invalid('input')],
		type : "Carrier",
		nickname : "updateCarrier"
	},
	'action': function(req, res, next) {
		var query = req.query;
		if(!query || !query.id) {
			throw swe.invalid('carrier id');
		} else if(!query || !query.name) {
			throw swe.invalid('carrier name');
		} else {
			// Update an existing document (database will be updated automatically)
			Carrier.model.update({ _id : query.id }, { name: query.name }, function (err, numRowsAffected, raw) {
				if (err) return res.send(500, { error: err });

				if (numRowsAffected > 0) {
					res.send(raw);
				} else {
					res.send(500, { error: 'carrier not updated' });
				};
			});
		}
	}
};

exports.updateManufacturer = {
	'spec': {
		path : "/manufacturer",
		notes : "Update an existing manufacturer",
		summary : "Update an existing manufacturer",
		method: "PUT",
		parameters : [
			param.query("id", "Manufacturer ID to update", "string", true),
			param.query("name", "New manufacturer name to use", "string", true)
		],
		responseMessages : [swe.invalid('input')],
		type : "Manufacturer",
		nickname : "updateManufacturer"
	},
	'action': function(req, res, next) {
		var query = req.query;
		if(!query || !query.id) {
			throw swe.invalid('manufacturer id');
		} else if(!query || !query.name) {
			throw swe.invalid('manufacturer name');
		} else {
			// Update an existing document (database will be updated automatically)
			Manufacturer.model.update({ _id : query.id }, { name: query.name }, function (err, numRowsAffected, raw) {
				if (err) return res.send(500, { error: err });

				if (numRowsAffected > 0) {
					res.send(raw);
				} else {
					res.send(500, { error: 'manufacturer not updated' });
				};
			});
		}
	}
};

exports.updatePhone = {
	'spec': {
		path : "/phone",
		notes : "Update an existing phone",
		summary : "Update an existing phone",
		method: "PUT",
		parameters : [
			param.query("id", "Phone ID to update", "string", true),
			param.query("name", "New phone name to use", "string", true)
		],
		responseMessages : [swe.invalid('input')],
		type : "Phone",
		nickname : "updatePhone"
	},
	'action': function(req, res, next) {
		var query = req.query;
		if(!query || !query.id) {
			throw swe.invalid('phone id');
		} else if(!query || !query.name) {
			throw swe.invalid('phone name');
		} else {
			// Update an existing document (database will be updated automatically)
			Phone.model.update({ _id : query.id }, { name: query.name }, function (err, numRowsAffected, raw) {
				if (err) return res.send(500, { error: err });

				if (numRowsAffected > 0) {
					res.send(raw);
				} else {
					res.send(500, { error: 'phone not updated' });
				};
			});
		}
	}
};

/**
* Delete methods
*/
exports.deleteCarrier = {
	'spec': {
		path : "/carrier",
		notes : "Delete an existing carrier",
		summary : "Delete an existing carrier",
		method: "DELETE",
		parameters : [
			param.query("id", "Carrier ID to delete", "string", true)
		],
		responseMessages : [swe.invalid('input')],
		type : "Carrier",
		nickname : "updateCarrier"
	},
	'action': function(req, res, next) {
		var query = req.query;
		if(!query || !query.id) {
			throw swe.invalid('carrier id');
		} else {
			// Delete an existing document (database will be updated automatically)
			Carrier.model.remove({ _id : query.id }, function (err) {
				if (err) return res.send(500, { error: err });

				res.send(200, { 'msg' : 'ok' });
			});
		}
	}
};

exports.deleteManufacturer = {
	'spec': {
		path : "/manufacturer",
		notes : "Delete an existing manufacturer",
		summary : "Delete an existing manufacturer",
		method: "DELETE",
		parameters : [
			param.query("id", "Manufacturer ID to delete", "string", true)
		],
		responseMessages : [swe.invalid('input')],
		type : "Manufacturer",
		nickname : "updateManufacturer"
	},
	'action': function(req, res, next) {
		var query = req.query;
		if(!query || !query.id) {
			throw swe.invalid('manufacturer id');
		} else {
			// Delete an existing document (database will be updated automatically)
			Carrier.model.remove({ _id : query.id }, function (err) {
				if (err) return res.send(500, { error: err });

				res.send(200, { 'msg' : 'ok' });
			});
		}
	}
};

exports.deletePhone = {
	'spec': {
		path : "/phone",
		notes : "Delete an existing phone",
		summary : "Delete an existing phone",
		method: "DELETE",
		parameters : [
			param.query("id", "Phone ID to delete", "string", true)
		],
		responseMessages : [swe.invalid('input')],
		type : "Phone",
		nickname : "updatePhone"
	},
	'action': function(req, res, next) {
		var query = req.query;
		if(!query || !query.id) {
			throw swe.invalid('phone id');
		} else {
			// Delete an existing document (database will be updated automatically)
			Phone.model.remove({ _id : query.id }, function (err) {
				if (err) return res.send(500, { error: err });

				res.send(200, { 'msg' : 'ok' });
			});
		}
	}
};