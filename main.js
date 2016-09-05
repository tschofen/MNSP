//Lets require/import the HTTP module
var http = require('http');
var cheerio = require("cheerio");
var request = require("request");
var rp = require('request-promise');
var fs = require('fs');
var formidable = require("formidable");
var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var path = require('path');
var prep = require('./setData');
var view = require('./renderResults');

const url = require('url');

//Lets define a port we want to listen to
const PORT=8082;

const BASE = 'https://reservations.usedirect.com/MinnesotaWebHome/Accessible/AvailableUnitsADA.aspx?';
//var LISTING = BASE + 'place_id=70&arrivalDate=9/8/2016&nights=2'; 

var params;

function handleRequest(request, response) {
	params = url.parse(request.url, true).query;

	/*simple authentication via params*/
	if(process.env.LOCALENV == 'true'){
		//just skip over Losungswort
	} else {
		if(!params.lwt || params.lwt != process.env.LWT){
			response.writeHead(401);
			response.end('No access for you');
			return;
		}
	}

	/*read the form template and process it*/
	fs.readFile('form.html', function (err, data) {
			response.writeHead(200, {
				'Content-Type': 'text/html'
			});
			var html = "";

			if (request.method.toLowerCase() == 'post'){
				html += data; //pass in the empty form again
				//form was submitted so get the result data and output after the async scrape call
				outputData(request, response, html);
			} else if(request.method.toLowerCase() == 'get' && (params.startDate || params. startdate)){
				html += data; //pass in the empty form again
				outputEmail(request, response, html, params);
				//response.end('Blastomated');
			} else {
				html += prep.set(data);
				//output the form without any results
				response.write(html)
				response.end();
			}
	});
}

function outputEmail(request, response, html, fields){
	processData(request, response, html, fields, 'email');
}

//We need a function which handles requests and send response
function outputData(request, response, html){
	var form = new formidable.IncomingForm();
	form.parse(request, function (err, fields) {
		processData(request, response, html, fields, 'web');
	})
}

function processData(request, response, html, fields, mode){
	
	var cheerio = require('cheerio'); // Basically jQuery for node.js
	if(mode != 'email'){
		response.write(prep.set(html, fields)); //fill in the form fields from previous request
	}
	html = '<div class="container"><h2>Search Results: '+fields.park.split("|")[1]+'</h2><!-- RESULTS --></div>';

	var formErrors = [];
	//bad form entries
	if(fields.startDate == ""){
		formErrors.push("When, oh when!");
	}
	if(fields.nights < 1){
		fields.nights = "1";
	}
	if(fields.week < 1){
		fields.week = "1"
	}
	if(formErrors.length > 0){
		html = prep.setResults(html, formErrors.join(""));
		response.write(html);
		response.end();
		return;
	}
	var d = new Date(fields.startDate);

	var options = {
			uri: BASE + 'place_id=' + fields.park.split("|")[0] + '&arrivalDate=' + fields.startDate + '&nights=' + fields.nights,
			headers: {
				'User-Agent': 'request'
			},
			transform: function (body) {
				return cheerio.load(body);
			},
			loc: fields.park.split("|")[1],
			date: fields.startDate,
			day: d.getDay(),
			nights: Number(fields.nights)
	};
	//url params are getting clobbert
	options.exturl = options.uri;

	var urls = [Object.assign({}, options)];

	//no need to process if only 1
	for (var i = fields.week - 1; i > 0; i--) {
		d.setDate(d.getDate() + 7);
		var nextDate = (d.getMonth()+1)+'/'+ d.getDate() +'/'+d.getFullYear();
		options.uri = BASE + 'place_id=' + fields.park.split("|")[0] + '&arrivalDate=' + nextDate + '&nights=' + fields.nights;
		options.loc = fields.park.split("|")[1];
		options.date = (d.getMonth()+1)+'/'+ d.getDate() +'/'+d.getFullYear();
		options.day = d.getDay();
		options.exturl = options.uri;
		//clone the object
		urls.push(rp(Object.assign({}, options)));
	}
	// console.log('options', urls);


	/*now loop through all the urls and get the data*/
	var listings = [];

	/*process all calls in parallel*/
	function async(options, callback) {
		rp(options)
		.then(function ($) {
			var list = [];
			//console.log($.html());
			$('.UnitresultDiv').find('div > a').each(function (index, element) {
				list.push($(element).text());
			});
			listings.push(view.render(options, list));
			callback(options);
		})
		.catch(function (err) {
			// Crawling failed or Cheerio choked...
			console.log('trouble', err.name, err.statusCode); //full text: err.error
			var os = {loc: options.loc, day: options.day, date: options.date};
			listings.push(view.render(os));
			results.push({}); //results don't increase without this. Not sure why
			//console.log('results count', results.length);
			if(results.length == urls.length){
				html = prep.setResults(html, listings.join(""));
				if(mode != 'email'){
					response.write(html);
				}
			}
		});
	}
	function final() { 
		console.log('Done', results.length);
		html = prep.setResults(html, listings.join(""));
		if(mode == 'email'){
			sendEmail(html, options);
			console.log('email send');
			if(response){
				response.end('Blastomated');
			}
		} else {
			response.write(html);
			response.end();
		}
	}

	var results = [];

	urls.forEach(function(item) {
		async(item, function(result){
			results.push(result);
			if(results.length == urls.length) {
				final();
			}
		})
	});
}

function sendEmail(html, data){
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.EMAIL_ADDRESS, // Your email id
			pass: process.env.EMAIL_LWT // Your password
		}
	});

	var mailOptions = {
		from: process.env.EMAIL_ADDRESS, // sender address
		to: process.env.EMAIL_RECIPIENT_ADDRESS, // list of receivers
		subject: 'Campsite availability for ' + data.loc, // Subject line
		html: html //, // plaintext body
		// html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
	};
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			console.log(error);
			//res.json({yo: 'error'});
		}else{
			console.log('Message sent: ' + info.response);
			//res.json({yo: info.response});
		};
	});
}

/*Scheduling jobs*/
var rule = new schedule.RecurrenceRule();
if(process.env.SCHEDULED_PARKS && process.env.SCHEDULED_PARKS != ""){
	var emails = process.env.SCHEDULED_PARKS.split(",");
	console.log('LOG: Scheduled emails to ' + process.env.EMAIL_RECIPIENT_ADDRESS + ' for ' + emails.length + ' parks' + new Date());
	if(process.env.LOCALENV == 'true'){
		rule.second = 30;
	} else {
		rule.hour = 5; //in the morning
	}
	schedule.scheduleJob(rule, function(){
		var req, res;
		var d = new Date();
		if(d.getDay() < 5){
			d.setDate(d.getDate() + (5 - d.getDay()));
		} else if(d.getDay() > 5){
			d.setDate(d.getDate() + 6);
		}
		var params = {
			week: 4,
			nights: 2,
			startDate: (d.getMonth()+1)+'/'+ d.getDate() +'/'+d.getFullYear()
		}
		emails.forEach(function(park){
			params.park = park;
			outputEmail(req,res,"", params);
		})
	});
}



//Create a server
var server = http.createServer(function(req, res){
		// parse url
	var request = url.parse(req.url, true);
	var action = request.pathname;

	if (action === '/') {
		handleRequest(req,res);
	} else {
		//console.log('filt', path.join(__dirname, action).split('%20').join(' '))
		var filePath = path.join(__dirname, action).split('%20').join(' ');
		fs.exists(filePath, function (exists) {
			if (!exists) {
				// 404 missing files
				res.writeHead(404, {'Content-Type': 'text/plain' });
				res.end('404 Not Found');
				return;
			}
			// set the content type
			var ext = path.extname(action);
			var contentType = 'text/plain';
			if (ext === '.gif') {
				 contentType = 'image/gif'
			} else if (ext === '.png') {
				 contentType = 'image/png'
			}
			res.writeHead(200, {'Content-Type': contentType });
			// stream the file
			//fs.createReadStream(filePath, 'utf-8').pipe(res);
			// This line opens the file as a readable stream
			var readStream = fs.createReadStream(filePath);

			// This will wait until we know the readable stream is actually valid before piping
			readStream.on('open', function () {
				// This just pipes the read stream to the response object (which goes to the client)
				readStream.pipe(res);
			});

			// This catches any errors that happen while creating the readable stream (usually invalid names)
			readStream.on('error', function(err) {
				res.end(err);
			});
		});
	}

});

//Lets start our server
server.listen(process.env.PORT || PORT, function(){
		//Callback triggered when server is successfully listening. Hurray!
		console.log("Server listening on: http://localhost:%s -- %s", process.env.PORT || PORT, new Date());
});