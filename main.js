//Lets require/import the HTTP module
var http = require('http');
var cheerio = require("cheerio");
var request = require("request");
var queue = require('queue-async');
var url = require("url"); 
var rp = require('request-promise');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');
var prep = require('./setData');

//Lets define a port we want to listen to
const PORT=8082;
q = queue(10);

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
	var view = require('./renderResults');
	var form = new formidable.IncomingForm();
	form.parse(request, function (err, fields) {	
		var cheerio = require('cheerio'); // Basically jQuery for node.js

		var d = new Date(fields.startDate);
		var options = {
				uri: BASE + 'place_id=' + fields.park.split("|")[0] + '&arrivalDate=' + fields.startDate + '&nights=' + fields.length,
				headers: {
					'User-Agent': 'request'
				},
				transform: function (body) {
					return cheerio.load(body);
				},
				loc: fields.park.split("|")[1],
				date: fields.startDate,
				day: d.getDay()
		};

		var urls = [Object.assign({}, options)];

		//no need to process if only 1
		for (var i = fields.week - 1; i > 0; i--) {
			d.setDate(d.getDate() + 7);
			var nextDate = (d.getMonth()+1)+'/'+ d.getDate() +'/'+d.getFullYear();
			options.uri = BASE + 'place_id=' + fields.park.split("|")[0] + '&arrivalDate=' + nextDate + '&nights=' + fields.length;
			options.loc = fields.park.split("|")[1];
			options.date = (d.getMonth()+1)+'/'+ d.getDate() +'/'+d.getFullYear();
			options.day = d.getDay();
			//clone the object
			urls.push(rp(Object.assign({}, options)));
		}
		// console.log('options', urls);

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
				listings.push(view.render(list, options));
				callback(options);
			})
			.catch(function (err) {
				// Crawling failed or Cheerio choked...
				console.log('trouble', err);
				//response.write(html + '<h2 style="color:red">Something\' messed up</h2>');
				//response.end();
			});
		}
		function final() { 
			console.log('Done', results.length);
			html = prep.set(html, fields, '<h2>Search Results</h2>' + listings.join(""));
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
server.listen(PORT, function(){
		//Callback triggered when server is successfully listening. Hurray!
		console.log("Server listening on: http://localhost:%s", PORT);
});