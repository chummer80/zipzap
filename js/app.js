$(document).ready(function() {
	/***************
	* Constants
	****************/
	
	var DEBUG = true;
	var ENTER_KEY_CODE = 13;
	
	var WUNDERGROUND_API_URL = 'http://api.wunderground.com/api/';
	var WUNDERGROUND_API_KEY = '96b52a67f7730e2e';
	
	/***************
	* Variables
	****************/
	
	var zipCode = 00000;
	var zipCoordinates = {};
	var showingResults = false;
	var map = null;
	var geocodingBounds = null;
	var zipCodeOverlay = null;
	
	/***************
	* Functions
	****************/
	
	var debug = function debug(message) {
		if (DEBUG) {
			console.log(message);
		}
	};
	
	var isInputValid = function isInputValid() {
		var inputString = $('#zip_input_text').val();
		return /^\d{5}$/.test(inputString);
	};
	
	var toTitleCase = function toTitleCase(str)
	{
		return str.replace(/\w\S*/g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	var startGeocode = function startGeocode(zip) {
		var geocoder = new google.maps.Geocoder();
		
		geocoder.geocode({address: zip.toString()}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				debug("Geocode success");
				debug(results);
				
				// There might be multiple results from our search, but just use the first one.
				geocodingBounds = results[0].geometry.bounds;
				// we're not guaranteed to get bounds when we attempt to geocode.
				// if map is ready, we can draw the overlay.
				if ((geocodingBounds instanceof google.maps.LatLngBounds) && (map instanceof google.maps.Map)) {
					debug("startGeocode: map is ready, calling drawOverlay");
					drawOverlay(geocodingBounds);
				}
			}
			else {
				debug("Geocode was not successful for the following reason: " + status);
			}
		});
	};
	
	var startAJAX = function startAJAX(zip) {
		// change the heading of the results panel
		$('#zipcode').text(zip);
			
		var wUndergroundFullURL = WUNDERGROUND_API_URL + WUNDERGROUND_API_KEY + 
			'/conditions/q/' + zip + '.json';
			
		$.ajax(wUndergroundFullURL, {dataType: 'jsonp'})
			.done(function(data) {
				debug("WUnderground API SUCCESS");
				
				var wUnderground_results = $('#wunderground_results');
				
				if (data.response.error) {
					wUnderground_results.find('#location').text(data.response.error.description);
					// wUnderground_results.appendTo($('#results'));
				}
				else {
					var current = data.current_observation;
					
					var locationString = toTitleCase(current.display_location.city) + ", " + current.display_location.state + ", " + current.display_location.country;
					debug("location is " + locationString);
					wUnderground_results.find('#location').text(locationString);
					
					zipCoordinates.lat = Number(current.display_location.latitude);
					zipCoordinates.lng = Number(current.display_location.longitude);
					
					var coordinateString = current.display_location.latitude + ", " + current.display_location.longitude;
					wUnderground_results.find('#coordinates').text("Coordinates: " + coordinateString);
					
					wUnderground_results.find('#temperature').text("Temperature: " + current.temperature_string);
					wUnderground_results.find('#weather').text("Weather: " + current.weather);
					wUnderground_results.find('#weather_icon').attr('src', current.icon_url);
					wUnderground_results.find('#weather_icon').attr('alt', current.icon + " icon");
					
					// wUnderground_results.appendTo($('#results'));
					
					drawMap();
				}
				
				showResults();
			})
			.fail(function() {
				debug("WUnderground API FAIL");
			});
	};
	
	var drawMap = function drawMap() {
		var mapOptions = {
			center: zipCoordinates,
			zoom: 13
		};
		
		var mapCanvasDOM = $('#google_map_canvas')[0];
		map = new google.maps.Map(mapCanvasDOM, mapOptions);
		debug("map has been drawn");
		
		// if geocoding is already done, then the zip code overlay can be drawn. Otherwise just set a flag
		if ((geocodingBounds instanceof google.maps.LatLngBounds) && (map instanceof google.maps.Map)) {
			debug("drawMap: bounds are ready, calling drawOverlay");
			drawOverlay(map, geocodingBounds);
		}
	};
	
	var drawOverlay = function drawOverlay(map, bounds) {
		zipCodeOverlay = new google.maps.GroundOverlay('images/zipcode_highlight.png', bounds);
		zipCodeOverlay.setMap(map);
	};
	
	var showResults = function showResults() {
		if (!showingResults) {
			showingResults = true;
			$('#loading').hide();
			$('#results').fadeIn();
		}
	};
	
	/***************
	* Event Handlers
	****************/
	
	$('#zip_input_text').keypress(function(event) {
		
		var isDigit = function isDigit (keyCode) {
			debug("key entered (code): " + keyCode);
			
			var charEntered = String.fromCharCode(keyCode);
			debug("key entered (char): " + charEntered);
			
			var digitPattern = /^\d+$/;
			return digitPattern.test(charEntered);
		}
		
		if (event.which == ENTER_KEY_CODE) {
			$('#zip_input_button').click();
		}
		else {
			if (isDigit(event.which)) {
				debug("is digit");
			}
			else {
				debug("is not digit");				
				event.preventDefault();
			}
		}
	});
	
	$('#zip_input_text').keyup(function() {
		debug("textbox says: " + this.value);
		$('#zip_input_button').attr('disabled', isInputValid() ? false : true);
	});
		
	$('#zip_input_button').click(function() {
		debug("ZAP button clicked");
		
		var inputString = this.value;
		if (isInputValid()) {
			zipCode = $('#zip_input_text').val();
			$('#input_div').slideUp();	
			$('#loading').show('blind');
			
			startGeocode(zipCode);
			startAJAX(zipCode);
		}
	});
	
	
	/***************
	* Start
	****************/
	
	$('#input_div').slideDown();
});