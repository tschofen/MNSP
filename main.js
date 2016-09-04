//Lets require/import the HTTP module
var http = require('http');
var cheerio = require("cheerio");
var request = require("request");
var rp = require('request-promise');
var fs = require('fs');
var formidable = require("formidable");
var prep = require('./setData');
var view = require('./renderResults');

//Lets define a port we want to listen to
const PORT=8082;

const BASE = 'https://reservations.usedirect.com/MinnesotaWebHome/Accessible/AvailableUnitsADA.aspx?';
//var LISTING = BASE + 'place_id=70&arrivalDate=9/8/2016&nights=2'; 


function handleRequest(request, response) {
	fs.readFile('form.html', function (err, data) {
			response.writeHead(200, {
				'Content-Type': 'text/html'
			});
			var html = "";

			if (request.method.toLowerCase() == 'post'){
				html += data; //pass in the empty form again
				//form was submitted so get the result data and output after the async scrape call
				outputData(request, response, html);
			} else {
				html += prep.set(data);
				//output the form without any results
				response.write(html)
				response.end();
			}
	});
}

//We need a function which handles requests and send response
function outputData(request, response, html){
	var form = new formidable.IncomingForm();
	form.parse(request, function (err, fields) {	
		var cheerio = require('cheerio'); // Basically jQuery for node.js

		response.write(prep.set(html, fields)); //fill in the form fields from previous request
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
					response.write(html);
				}
			});
		}
		function final() { 
			console.log('Done', results.length);
			html = prep.setResults(html, listings.join(""));
			response.write(html);
			response.end();
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
	})
}

function sendResponse(response, list){
	//response.end('It Works!! Path Hit: ' + request.url);
	response.setHeader("Content-Type", "text/html");
	var html = JSON.stringify(list);
	//response.data = list;
	response.end(html);
}



//Create a server
var server = http.createServer(function(req, res){
	//if (req.method.toLowerCase() == 'get') {
			handleRequest(req,res);
	//} else if (req.method.toLowerCase() == 'post') {
	//    processAllFieldsOfTheForm(req, res);
	//}
});

//Lets start our server
server.listen(process.env.PORT || PORT, function(){
		//Callback triggered when server is successfully listening. Hurray!
		console.log("Server listening on: http://localhost:%s", PORT);
});