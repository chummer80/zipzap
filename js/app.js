// load google earth's "earth" module
google.load("earth", "1");

$(document).ready(function() {
	/***************
	* Constants
	****************/
	
	var DEBUG = true;
	var ENTER_KEY_CODE = 13;
	
	var WUNDERGROUND_API_URL = 'http://api.wunderground.com/api/';
	var WUNDERGROUND_API_KEY = '96b52a67f7730e2e';
	
	var INITIAL_MAP_ZOOM = 12;	// for google maps initial display
	
	/***************
	* Variables
	****************/
	
	var zipCode = '';
	var zipCoordinates = {};
	var map = null;
	var geocodingBounds = null;
	var zipCodeOverlay = null;
	var ge = null; // google earth object
	
	
	/***************
	* Functions
	****************/
	
	var debug = function debug(message) {
		if (DEBUG) {
			console.log(message);
		}
	};
	
	// reset all zip code data except for google map and google earth objects (for efficiency)
	var resetSearchData = function resetSearchData() {
		zipCode = '';
		zipCoordinates = {};
		geocodingBounds = null;
		
		if (zipCodeOverlay instanceof google.maps.GroundOverlay) {
			zipCodeOverlay.setMap(null);
			zipCodeOverlay = null;
		}
	};
	
	// detect a 5-digit zip code
	var isInputValid = function isInputValid() {
		var inputString = $('#zip_input_text').val();
		return /^\d{5}$/.test(inputString);
	};
	
	/***********************
	* Google Earth Functions
	************************/
	
	// Callback for creation of google earth object
	var geComplete = function geComplete(instance) {
		debug("Google Earth object was created");
		
		ge = instance;
		ge.getWindow().setVisibility(true);
		ge.getNavigationControl().setVisibility(ge.VISIBILITY_SHOW);
		ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true);
		ge.getLayerRoot().enableLayerById(ge.LAYER_BUILDINGS, true);
		ge.getLayerRoot().enableLayerById(ge.LAYER_ROADS, true);
		
		debug("Google Earth object should be visible now");
		
		// if coordinates have already been recieved, pan camera to that location
		if (zipCoordinates) {
			geLookAt(zipCoordinates);
		}
	};
	
	// Callback to handle google earth object creation failure
	var geFail = function geFail(errorCode) {
		debug("Google Earth object creation failed, error code: " + errorCode);
	};
	
	var geLookAt = function geLookAt(coordinates) {
		// Create a new LookAt.
		var lookAt = ge.createLookAt('');

		// Set the position values.
		lookAt.setLatitude(coordinates.lat);
		lookAt.setLongitude(coordinates.lng);
		lookAt.setRange(2000.0); //default is 0.0

		// Update the view in Google Earth.
		ge.getView().setAbstractView(lookAt);
	}
	
	/***********************
	* Google Maps Functions
	************************/
	
	// Get google maps geocoding data in order to get approximate zip code boundaries
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
					debug("startGeocode: map is ready, calling drawMapOverlay");
					drawMapOverlay(map, geocodingBounds);
				}
			}
			else {
				debug("Geocode was not successful for the following reason: " + status);
			}
		});
	};
	
		
	var drawMap = function drawMap() {
		var mapOptions = {
			center: zipCoordinates,
			zoom: INITIAL_MAP_ZOOM
		};
		
		if (map instanceof google.maps.Map) {
			map.setOptions(mapOptions);
		}
		else {
			var mapCanvasDOM = $('#google_map_canvas')[0];
			map = new google.maps.Map(mapCanvasDOM, mapOptions);
		}
		debug("map has been drawn");
		
		// if geocoding is already done, then the zip code overlay can be drawn. Otherwise just set a flag
		if (geocodingBounds instanceof google.maps.LatLngBounds) {
			console.assert(map instanceof google.maps.Map);
			debug("drawMap: bounds are ready, calling drawMapOverlay");
			drawMapOverlay(map, geocodingBounds);
		}
	};
	
	var drawMapOverlay = function drawMapOverlay(map, bounds) {
		zipCodeOverlay = new google.maps.GroundOverlay('images/zipcode_highlight.png', bounds);
		zipCodeOverlay.setMap(map);
		
		// Just in case the original coordinates are not the center of the zip code, re-center the map.
		map.setCenter(bounds.getCenter());
	};
	
	/***********************
	* AJAX Functions
	************************/
	
	// WeatherUnderground API call
	var startAJAX = function startAJAX(zip) {
		// change the heading of the results panel
		$('#zipcode').text(zip);
			
		var wUndergroundFullURL = WUNDERGROUND_API_URL + WUNDERGROUND_API_KEY + 
			'/geolookup/conditions/q/' + zip + '.json';
			
		$.ajax(wUndergroundFullURL, {dataType: 'jsonp'})
			.done(function(data) {
				debug("WUnderground API response was received");
				
				var wUnderground_results = $('#wunderground_results');
				
				if (data.response.error) {
					debug("WUnderground API error");
					wUnderground_results.find('#location').text(data.response.error.description);
				}
				else {
					debug("WUnderground API SUCCESS");
					var geolookup = data.location;
					var current = data.current_observation;
					
					zipCoordinates.lat = Number(geolookup.lat);
					zipCoordinates.lng = Number(geolookup.lon);

					// populate Info tab
					var locationString = geolookup.city + ", " + geolookup.state + ", " + geolookup.country_name;
					debug("location is " + locationString);
					wUnderground_results.find('#location').text(locationString);
					
					var coordinateString = zipCoordinates.lat + ", " + zipCoordinates.lng;
					wUnderground_results.find('#coordinates').text("Coordinates: " + coordinateString);
					
					wUnderground_results.find('#time_zone').text("Time Zone: " + geolookup.tz_short);
					wUnderground_results.find('#temperature').text("Temperature: " + current.temperature_string);
					wUnderground_results.find('#weather').text("Weather: " + current.weather);
					wUnderground_results.find('#weather_icon').attr('src', current.icon_url);
					wUnderground_results.find('#weather_icon').attr('alt', current.icon + " icon");
					
					// if map object exists already, pan map to the right place.
					if (map instanceof google.maps.Map) {
						drawMap();
					}
					
					// if google earth obj exists, pan google earth camera to this location
					if (ge) {
						geLookAt(zipCoordinates);
					}
				}
				
				$('#loading').hide();
				$('#results').fadeIn();
			})
			.fail(function() {
				debug("WUnderground API FAIL");
			});
	};
	
	/**************************
	* DOM Object Event Handlers
	***************************/
	
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
	
	$('#new_zap_button').click(function() {
		$('#results').slideUp();
		
		// clear previous search
		$('#zip_input_button').attr('disabled', true);
		$('#zip_input_text').val("");
		resetSearchData();
		
		$('#input_div').slideDown(function() {
		
			$('#zip_input_text').focus();
		
		});
	});
	
	/***************
	* Start
	****************/
	
	// initialize JQuery tab widget
	$('#tabs').tabs({
		activate: function (event, ui) {
			// the first time this tab is viewed, create google map
			if (ui.newPanel.is('#google_map_canvas') && !(map instanceof google.maps.Map)) {
				drawMap();
			}
			// the first time this tab is viewed, create google earth obj
			else if (ui.newPanel.is('#google_earth') && !ge) {
				google.earth.createInstance('google_earth', geComplete, geFail);
			}
		}
	});
	
	// reveal user input area
	$('#input_div').slideDown();
});