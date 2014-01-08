/**
* Sample API build using Swagger by Wordnik, based loosly on their 
* swagger-node-express example at https://github.com/wordnik/swagger-node-express
*
* @author Dan Giulvezan
*
* @requires express 		Routing module
* @requires url 			Allows the URL to be read
* @requires fs 				Provides access to the servers file system
* @requires swagger 		Generates the API docs dynamically
* @requires express-extras 	Adds additional middleware options to express; used for throttling
*
* @uses config.js
* @uses api.js
* @uses models/*
*
* @beta
*/

// Include express and swagger in the application.
var express = require("express"),
	url = require("url"),
	fs = require('fs'),
	swagger = require("./Common/node/swagger.js"),
	extras = require('express-extras'),
	api = require('./api.js');

var app = express();
app.use(express.json());
app.use(express.urlencoded());

// Setup throttling to keep users from abusing the API
app.use(extras.throttle({
	urlCount: 100,
	urlSec: 1,
	holdTime: 10,
	whitelist: {
		'127.0.0.1': true
	}
}));

// Set the main handler in swagger to the express app
swagger.setAppHandler(app);

// This is a sample validator.  It simply says that for _all_ POST, DELETE, PUT
// methods, the header `api_key` OR query param `api_key` must be equal
// to the string literal `1234`.  All other HTTP ops are A-OK
swagger.addValidator(
	function validate(req, path, httpMethod) {
		//  example, only allow POST for api_key="special-key"
		if ("POST" == httpMethod || "DELETE" == httpMethod || "PUT" == httpMethod) {
			var apiKey = req.headers["api_key"];
			if (!apiKey) {
				apiKey = url.parse(req.url,true).query["api_key"];
			}
			if ("1234" == apiKey) {
				return true; 
			}
			return false;
		}
		return true;
	}
);

// Find all of the model files in the 'models' folder and add the their definitions to swagger
// so it can be displayed in the docs
fs.readdir('models', function(err, list) {
	if (err) return done(err);

	if (list) {
		list.forEach(function(file) {
			file = 'models' + '/' + file;
			fs.stat(file, function(err, stat) {
				console.log('adding model def from ' + file);
				swagger.addModels( require('./' + file).def );
			});
		});
	};
});


// Add methods to swagger
swagger
	.addGet(api.getAllCarriers)
	.addGet(api.getAllManufacturers)
	.addGet(api.getAllPhones)
	.addGet(api.getCarrierById)
	.addGet(api.getManufacturerById)
	.addGet(api.getPhoneById)

	.addPost(api.addCarrier)
	.addPost(api.addManufacturer)
	.addPost(api.addPhone)

	.addPut(api.updateCarrier)
	.addPut(api.updateManufacturer)
	.addPut(api.updatePhone)

	.addDelete(api.deleteCarrier)
	.addDelete(api.deleteManufacturer)
	.addDelete(api.deletePhone)

/*swagger.configureDeclaration("carrier", {
	description : "Operations about phone carriers",
	authorizations : ["oauth2"],
	produces: ["application/json"]
});

swagger.configureDeclaration("manufacturer", {
	description : "Operations about phone manufacturers",
	authorizations : ["oauth2"],
	produces: ["application/json"]
});*/

// set api info
swagger.setApiInfo({
	title: "Swagger sample app for cell phone, manufacturer, and carrier data",
	description: "This is a sample API for a small database of cell phones, manufacturers, and carriers. For this sample, you can use the api key \"1234\" to test the authorization filters",
	termsOfServiceUrl: "http://helloreverb.com/terms/",
	contact: "apiteam@wordnik.com",
	//license: "Apache 2.0",
	//licenseUrl: "http://www.apache.org/licenses/LICENSE-2.0.html"
});

swagger.setAuthorizations({
	apiKey: {
		type: "apiKey",
		passAs: "header"
	}
});

// Configures the app's base path and api version.
swagger.configureSwaggerPaths("", "api-docs", "")
swagger.configure("http://localhost:8002", "1.0.0");

// Serve up swagger ui at /docs via static route
var docs_handler = express.static(__dirname + '/swagger-ui/');
app.get(/^\/docs(\/.*)?$/, function(req, res, next) {
	if (req.url === '/docs') { // express static barfs on root url w/o trailing slash
		res.writeHead(302, { 'Location' : req.url + '/' });
		res.end();
		return;
	}
	// take off leading /docs so that connect locates file correctly
	req.url = req.url.substr('/docs'.length);
	return docs_handler(req, res, next);
});

// Start the server on port 8002
app.listen(8002);