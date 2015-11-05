*Heads up: This repo's a work in progress, so expect it to change while the idea is flushed out more*

### What is this

This is a rather simple example of an API that can do CRUD operations on documents stored in a MongoDB database.

This code started out as Wordnik's [swagger-node-express](https://github.com/wordnik/swagger-node-express) example, but it's been changed so much that it doesn't make sense to just call it a fork of that repo. Speaking of that swagger-node-express repo, if you're looking for a good place to get started learning about creating an API with Swagger, that's a great project to take a look at.

### What's needed

This API runs on node.js, and makes use of the following:

- [Express](https://github.com/visionmedia/express) - node.js framework that handles routing
- [ExpressJS Extras](https://github.com/davglass/express-extras) - An add-on to Express that's used to add support for throttling
- [MongoDB](http://mongodb.com) - NoSQL database that holds our data
- [Mongoose](http://mongoosejs.com/) - ODM (object data mapping) layer, translates your data into JavaScript objects so you can work with them easier
- [Swagger UI](https://github.com/wordnik/swagger-ui) - Framework to help describe, produce, and test a RESTful web service


### The data

This project uses data about mobile phones, and it assumes that it's stored in a MongoDB database. Since I can't include a link to my dev database, I've pasted the same data here so you can toss it into your own (I called mine "phones"), create your collections, and add the data.

Basically, you'll need three collections:

- carriers
- manufacturers
- phones

Add the data below to each of those:

```
carriers:

[
  {
    "_id": "52b0d4cce4b01af504503c80",
    "name": "AT&T"
  },
  {
    "_id": "52b0d4d9e4b01af504503c81",
    "name": "Sprint"
  },
  {
    "_id": "52b0d4e5e4b01af504503c83",
    "name": "T-Mobile"
  },
  {
    "_id": "52b0d4f5e4b01af504503c84",
    "name": "Verizon"
  }
]
```
```
manufacturers:

[
  {
    "_id": "52b0d50fe4b01af504503c86",
    "name": "Apple"
  },
  {
    "_id": "52b0d51be4b01af504503c87",
    "name": "HTC"
  },
  {
    "_id": "52b0d526e4b01af504503c88",
    "name": "LG"
  },
  {
    "_id": "52b0d539e4b01af504503c89",
    "name": "Motorola"
  },
  {
    "_id": "52b0d550e4b01af504503c8f",
    "name": "Nokia"
  },
  {
    "_id": "52b0d55be4b01af504503c90",
    "name": "Samsung"
  },
  {
    "_id": "52cc90a43169023e91000001",
    "name": "BlackBerry"
  }
]
```
```
phones:

[
  {
    "_id": "52b0e16ae4b01af504503ccc",
    "name": "iPhone 5S",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce36be4b012c8a1bdea54",
    "name": "iPhone 5C",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce384e4b012c8a1bdea57",
    "name": "iPhone 5",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce3c9e4b012c8a1bdea5d",
    "name": "Galaxy S4",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce3e2e4b012c8a1bdea5f",
    "name": "Galaxy Note 3",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce422e4b012c8a1bdea7f",
    "name": "One",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce495e4b012c8a1bdea82",
    "name": "Q10",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce4d4e4b012c8a1bdea84",
    "name": "Moto X",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce5cfe4b012c8a1bdea88",
    "name": "Lumia 928",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  },
  {
    "_id": "52cce63de4b012c8a1bdea8e",
    "name": "G2",
    "status": "available",
    "carriers": [
      {
        "$ref": "carriers",
        "$id": "52b0d4cce4b01af504503c80",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4d9e4b01af504503c81",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4e5e4b01af504503c83",
        "$db": ""
      },
      {
        "$ref": "carriers",
        "$id": "52b0d4f5e4b01af504503c84",
        "$db": ""
      }
    ]
  }
]
```

### Getting started with the API

Clone this projet (or download the zip file), then run ```npm install``` to install the dependencies.

Next you'll want to create your own "config.js" file. There's a file in the project called "config-sample.js" that you can copy to "config.js", and modify it to include the connection string to your database.

The file will look like the one below. Just replace the dummy connection string with the real one you'll be using.


```
/**
* Config file for the API
*/
exports.db_url = 'mongodb://username:password@your-mongo-host.com/database-name';

```

Now, startup up server with the command `node server.js`, and you should see the messages below:

	Database connecting
	adding model def from models/carrier.js
	adding model def from models/manufacturer.js
	adding model def from models/phone.js
	Database connection established

If you don't see those messages, double check the connection string to your database in your config file, and make sure the file is called "config.js" and not "config-sample.js".


#### Have fun

At this point your API should be running and you can start testing it out. Thankfully, swagger-ui makes it really easy to start playing around with your API by automatically generating your API docs, and it even gives you the ability to test each of your methods without having to write your own code.

To see your API docs, just go to [http://localhost:8002/docs](http://localhost:8005/docs).

#### Known issues

Nothing right this moment, but I'm sure some problems are in there, I just haven't caught them yet. :)