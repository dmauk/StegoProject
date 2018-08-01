// app.js

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');	// import bodyParser to parse the body of API requests
var multer = require('multer');				// File upload support
var checksum = require('checksum');			// Does Checksum things
var fs = require('fs');						// Filesystem Object thing

var uploadDir = __dirname + "/uploads/";
var outputDir = __dirname + "/output/";
var resultDir = __dirname + "/result/";

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multer({ dest: uploadDir})); // Set upload directory to /uploads


var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
 	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    var result = { "message": 'Steganography API!' };
    res.json(result); 
});

// req.params.extraThing to access :extraThing
// req.body gives key=>value pairs in JSON

router.route('/embed')
    .get(function(req,res){
    	var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only POST is exposed for this command.";
    	result.arguments = "cover, embed, [password], [filetype]. [optional]";
    	res.status(400).json(result);
    })
    .post(function(req, res) {
		// Has parameters cover, embed, [password], and [filetype]
		// returns ID for embedded file
		console.log("Time to embed!");
		var coverF = req.files.cover, embedF = req.files.embed;
		var hasCalled = false;
		embed(coverF, embedF, req.body.password, req.body.filetype, function(result){
			if(hasCalled === false){
				if(typeof result.error !== 'undefined'){
					// Throw an error if there's an error
					res.status(500).json(result);
				}
				else{
					res.json(result);
					fs.unlink(uploadDir + coverF.name, function(err){
						if (err) {
					      errLog(err);
					    }
					});
					fs.unlink(uploadDir + embedF.name, function(err){
						if (err) {
					      errLog(err);
					    }
					});
				}
				hasCalled = true;
			}
		});
    })
    .put(function(req,res){
    	var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only POST is exposed for this command.";
    	result.arguments = "cover, embed, [password], [filetype]. [optional]";
    	res.status(400).json(result);
    })
    .delete(function(req,res){
    	var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only POST is exposed for this command.";
    	result.arguments = "cover, embed, [password], [filetype]. [optional]";
    	res.status(400).json(result);
    });
router.route('/info/')
	.post(function(req,res){
		var result = {};
		result.message = "";
		var coverF = req.files.cover;
		var password;
		if(typeof req.password == 'undefined'){
			password = "";
		}
		var command = ["info"];
		command.push(coverF.path,"-p",password);
		var spawn = require('child_process').spawn;
		var child = spawn('steghide', command);
		child.stdout.on('data', function (data){
			console.log(data.toString());
			if(data.toString().indexOf("capacity") > -1){
				result.message = data.toString();
				res.json(result);
			} else {
				// Do Nothing
			}
		});
	});
router.route('/retrieve/:id')
	.get(function(req,res){
		var id = req.params.id;
		console.log("Retrieving: ", id);
		res.sendFile(id, {root:outputDir}, function (err) {
		    if (err) {
		      errLog(err);
		      console.log(err);
		      res.status(err.status).end();
		    }
		    else {
		      console.log('Sent:', id);
			}
		});
	})
	.post(function(req,res){
		var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only GET and DELETE are exposed for this command.";
    	result.arguments = "/retrieve/:id";
    	res.status(400).json(result);
	})
	.put(function(req,res){
		var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only GET and DELETE are exposed for this command.";
    	result.arguments = "/retrieve/:id";
    	res.status(400).json(result);
	})
	.delete(function(req,res){
		var id = req.params.id;
		var file = outputDir + id;
		fs.unlink(file, function (err) {
			if (err) {
				errLog(err);
				res.status(err.status).end();
			}
			else {
				res.json({"message":"File Deleted"});
				console.log('Deleted:',id);
			}
		});
	});

router.route('/extract')
	.get(function(req,res){
		var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only POST is exposed for this command.";
    	result.arguments = "embed, [password], [filetype]. [optional]";
    	res.status(400).json(result);
	})
	.post(function(req,res){
		// has parameters {embed}, [password], [filetype] 
		// returns embedded file
		console.log("time to extract");
		var embed = req.files.embed;
		var hasCalled = false;
		extract(embed, req.body.password, req.body.filetype, function(result){
			if(hasCalled === false){
				if(typeof result.error !== 'undefined'){
					res.status(500).json(result);
				}
				else{
					// res.json(result);
					res.sendFile(result.fileName, {root:resultDir}, function (err) {
					    if (err) {
					    	errLog("kek" + err);
					    	res.status(err.status).end();
					    }
					    else {
					      	console.log('Sent:', result.fileName);
	  						fs.unlink(uploadDir + embed.name, function(err){
								if (err) {
						    		errLog("unlinkerror " + err);
						    	}
							});
							fs.unlink(resultDir + result.fileName,function(err){
								if (err) {
							      	errLog("unlinkerror " + err);
							    }
							});
						}
					});
				}
				hasCalled = true;	
			}
		});
	})
	.put(function(req,res){
		var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only POST is exposed for this command.";
    	result.arguments = "embed, [password], [filetype]. [optional]";
    	res.status(400).json(result);
    })
    .delete(function(req,res){
    	var result = {};
    	result.error = true;
    	result.message = "Invalid Request. Only POST is exposed for this command.";
    	result.arguments = "embed, [password], [filetype]. [optional]";
    	res.status(400).json(result);
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /steganography
app.use('/steganography', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

// Embed/Extract functions ----------------------------
// =============================================================================
function embed(cover, embedFile, password, filetype, callback){
	var result = {};
	if(typeof password == 'undefined'){
		password = "";
	}
	filetype = filetype || cover.extension;

	if(/^jpe?g|au|bmp|wav$/i.test(filetype)){
		// Use Steghide
		var id = cover.name.split(".")[0] + ".";
		var output = outputDir + id + filetype;
		var command = ["embed", "-cf"];
		command.push(cover.path, "-ef", embedFile.path, "-sf", output, "-p", password, "-e", "blowfish");
		var spawn = require('child_process').spawn;
		var child = spawn('steghide', command);
		child.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
			if(data.toString().indexOf("done") > -1){
				checksum.file(output, function (err, sum) {
					if(err){
						errLog(err);
						result.error = true;
						result.message = err;
						callback(result);
					}
					result.id = id+filetype;
					result.checksum_sha1 = sum;
					callback(result);	 
				});
			} else if (data.toString().indexOf("could not open file") > -1){
				result.error = true;
				result.message = "Could Not open File";
				callback(result);
			} else if (data.toString().indexOf("the cover file is too short to embed the data") > -1){
				result.error = true;
				result.message = "Cover file must be larger than Embed file";
				callback(result);
			} else if (data.toString().indexOf("steghide:") > -1){
				// Do nothing
			} else if (data.toString().indexOf("writing stego file") > -1){
				// Do Nothing
			} else {
				result.error = true;
				result.message = data.toString();
				callback(result);
			}
		});
	} else if(/^png$/i.test(filetype)){
		result.error = true;
		result.message = "PNG Images Not Supported (yet)";
		callback(result);
	} else {
		result.error = true;
		result.message = "Invalid Filetype";
		callback(result);
	}
}

function extract(cover, password, filetype, callback){
	var result = {};
	if(typeof password == 'undefined'){
		password = "";
	}
	filetype = filetype || cover.extension;
	if(/^jpe?g|au|bmp|wav$/i.test(filetype)){
		// Use Steghide
		var args = ['extract', '-f', '-sf'];
		args.push(cover.path,'-p', password);
		var spawn = require('child_process').spawn;
		var child = spawn('steghide', args, {cwd: resultDir});
		child.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
			if(data.toString().indexOf("wrote extracted data to ") > -1){
				result.fileName = data.toString().substring(data.toString().indexOf('"')+1,data.toString().lastIndexOf('"'));
				//var move = spawn('mv',[result.fileName,resultDir],);
				callback(result);
			} else if (data.toString().indexOf("could not extract any data with that passphrase") > -1){
				result.error = true;
				result.message = "Invalid Password";
				callback(result);
			} else if (data.toString().indexOf("steghide:") > -1){
				// Do nothing
			} else {
				result.error = true;
				result.message = data.toString();
				callback(result);
			}	
		});
	} else if(/^png$/i.test(filetype)){
		result.error = true;
		result.message = "Lossless Images Not Supported (yet)";
		callback(result);
	} else {
		result.error = true;
		result.message = "Invalid Filetype";
		callback(result);
	}
}

function errLog(item){
	console.log("Error: " + item);
}