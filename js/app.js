// load google earth's "earth" module
google.load("earth", "1");

$(document).ready(function() {
	/***************
	* Constants
	****************/
	
	// var DEBUG = true;
	var DEBUG = false;
	var ENTER_KEY_CODE = 13;
	
	var WUNDERGROUND_API_URL = 'http://api.wunderground.com/api/';
	var WUNDERGROUND_API_KEY = '96b52a67f7730e2e';
	
	var INITIAL_MAP_ZOOM = 12;	// for google maps initial display
	
	/***************
	* Variables
	****************/
	
	var zip = {
		zipCode: '',
		zipCoordinates: {},
		map: null,	//google.maps.Map object
		mapExists: false,
		geocodingBounds: null,	//google.maps.LatLngBounds object
		zipCodeOverlay: null,	//google.maps.GroundOverlay object
		ge: null, // google earth object
		geExists: false
		
	};
	
	/***************
	* Functions
	****************/
	
	var debug = function debug(message) {
		if (DEBUG) {
			console.log(message);
		}
	};
	
	// detect a 5-digit zip code
	var isValidZipCode = function isValidZipCode(zipCodeString) {
		return /^\d{5}$/.test(zipCodeString);
	};
	
	// reset all zip code data except for google map and google earth objects (for efficiency)
	zip.resetSearchData = function resetSearchData() {
		zip.zipCode = '';
		zip.zipCoordinates = {};
		zip.geocodingBounds = null;
		
		zip.removeMapOverlay();
		
		// clear all search results except google map and google earth
		$('#zipcode').text("");
		$('.wunderground_result').text("");
		$('#weather_icon').attr('src', '//:0');
		$('#weather_icon').attr('alt', '');
		
		// enable all tabs if they were disabled previously
		$('#tabs').tabs('enable');
	};
	
	/***********************
	* Google Earth Functions
	************************/
	
	// Callback for creation of google earth object
	zip.geComplete = function geComplete(instance) {
		debug("Google Earth object was created");
		
		zip.ge = instance;
		zip.ge.getWindow().setVisibility(true);
		zip.ge.getNavigationControl().setVisibility(zip.ge.VISIBILITY_SHOW);
		zip.ge.getLayerRoot().enableLayerById(zip.ge.LAYER_BORDERS, true);
		zip.ge.getLayerRoot().enableLayerById(zip.ge.LAYER_BUILDINGS, true);
		zip.ge.getLayerRoot().enableLayerById(zip.ge.LAYER_ROADS, true);
		
		debug("Google Earth object should be visible now");
		
		// if coordinates have already been recieved, pan camera to that location
		if (zip.zipCoordinates) {
			zip.geLookAt();
		}
	};
	
	// Callback to handle google earth object creation failure
	zip.geFail = function geFail(errorCode) {
		debug("Google Earth object creation failed, error code: " + errorCode);
	};
	
	zip.geLookAt = function geLookAt() {
		// Create a new LookAt.
		var lookAt = zip.ge.createLookAt('');

		// Set the position values.
		lookAt.setLatitude(zip.zipCoordinates.lat);
		lookAt.setLongitude(zip.zipCoordinates.lng);
		lookAt.setRange(2000.0); //default is 0.0

		// Update the view in Google Earth.
		zip.ge.getView().setAbstractView(lookAt);
	}
	
	/***********************
	* Google Maps Functions
	************************/

	zip.drawMap = function drawMap() {
		var mapOptions = {
			center: zip.zipCoordinates,
			zoom: INITIAL_MAP_ZOOM
		};
		
		if (zip.map instanceof google.maps.Map) {
			zip.map.setOptions(mapOptions);
		}
		else {
			var mapCanvasDOM = $('#google_map_canvas')[0];
			zip.map = new google.maps.Map(mapCanvasDOM, mapOptions);
		}
		debug("map has been drawn");
	};
	
	// Get google maps geocoding data in order to get approximate zip code boundaries
	zip.startGeocode = function startGeocode() {
		var geocoder = new google.maps.Geocoder();
		
		geocoder.geocode({address: zip.zipCode}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				debug("Geocode success");
				debug(results);
				
				// There might be multiple results from our search, but just use the first one.
				zip.geocodingBounds = results[0].geometry.bounds;
				// we're not guaranteed to get bounds when we attempt to geocode.
				// if map is ready, we can draw the overlay.
				if ((zip.geocodingBounds instanceof google.maps.LatLngBounds) && (zip.map instanceof google.maps.Map)) {
					debug("startGeocode: map is ready, calling drawMapOverlay");
					zip.drawMapOverlay();
				}
			}
			else {
				debug("Geocode was not successful for the following reason: " + status);
			}
		});
	};

	zip.drawMapOverlay = function drawMapOverlay() {
		zip.zipCodeOverlay = new google.maps.GroundOverlay('images/zipcode_highlight.png', zip.geocodingBounds);
		zip.zipCodeOverlay.setMap(zip.map);
		
		// Just in case the original coordinates are not the center of the zip code, re-center the map.
		zip.map.setCenter(zip.geocodingBounds.getCenter());
	};
	
	zip.removeMapOverlay = function removeMapOverlay() {
		if (zip.zipCodeOverlay instanceof google.maps.GroundOverlay) {
			zip.zipCodeOverlay.setMap(null);
			zip.zipCodeOverlay = null;
			
			debug("Map overlay was removed");
		}
	}
	
	/***********************
	* AJAX Functions
	************************/
		
	// WeatherUnderground API call
	zip.startAJAX = function startAJAX() {
		// change the heading of the results panel
		$('#zipcode').text(zip.zipCode);
			
		var wUndergroundFullURL = WUNDERGROUND_API_URL + WUNDERGROUND_API_KEY + 
			'/geolookup/conditions/q/' + zip.zipCode + '.json';
			
		$.ajax(wUndergroundFullURL, {dataType: 'jsonp'})
			.done(zip.wUndergroundCB)
			.fail(function() {
				debug("WUnderground API FAIL");
			});
	};
	
	zip.wUndergroundCB = function wUndergroundCB (data) {
		console.log(this);
		
		debug("WUnderground API response was received");
		
		var wUnderground_results = $('#wunderground_results');
		
		if (data.response.error) {
			debug("WUnderground API error");
			wUnderground_results.find('#location').text(data.response.error.description);
			
			$('#tabs').tabs('option', 'active', 0);	// switch to the "info" tab
			$('#tabs').tabs('option', 'disabled', [1,2]);	// disable the maps and 3d view tabs
			
		}
		else {
			debug("WUnderground API SUCCESS");
			var geolookup = data.location;
			var current = data.current_observation;
			
			zip.zipCoordinates.lat = Number(geolookup.lat);
			zip.zipCoordinates.lng = Number(geolookup.lon);

			// populate Info tab
			var locationString = geolookup.city + ", " + geolookup.state + ", " + geolookup.country_name;
			debug("location is " + locationString);
			wUnderground_results.find('#location').text(locationString);
			
			var coordinateString = zip.zipCoordinates.lat + ", " + zip.zipCoordinates.lng;
			wUnderground_results.find('#coordinates').text("Coordinates: " + coordinateString);
			
			wUnderground_results.find('#time_zone').text("Time Zone: " + geolookup.tz_short);
			wUnderground_results.find('#temperature').text("Temperature: " + current.temperature_string);
			wUnderground_results.find('#weather').text("Weather: " + current.weather);
			wUnderground_results.find('#weather_icon').attr('src', current.icon_url);
			wUnderground_results.find('#weather_icon').attr('alt', current.icon + " icon");
			
			// if map object exists already, pan map to the right place.
			// if map doesn't exist yet, it will be drawn later when the map tab is clicked.
			if (zip.map instanceof google.maps.Map) {
				zip.drawMap();
				zip.startGeocode();
			}
			
			// if google earth obj exists, pan google earth camera to this location
			if (zip.ge) {
				zip.geLookAt();
			}
		}
		
		$('#loading').hide();
		$('#results').fadeIn();
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
				event.preventDefault(); // prevent the input from appearing in the textbox
			}
		}
	});
	
	$('#zip_input_text').keyup(function() {
		debug("textbox says: " + this.value);
		$('#zip_input_button').attr('disabled', isValidZipCode(this.value) ? false : true);
	});
		
	$('#zip_input_button').click(function() {
		debug("ZAP button clicked");
		
		if (isValidZipCode($('#zip_input_text').val())) {
			zip.zipCode = $('#zip_input_text').val();
			$('#input_div').slideUp();	
			$('#loading').show('blind');
			
			zip.startAJAX();
		}
	});
	
	$('#new_zap_button').click(function() {
		$('#results').slideUp(function() {
			zip.resetSearchData();
		});
		
		// clear previous search input
		$('#zip_input_button').attr('disabled', true);
		$('#zip_input_text').val("");
			
		$('#input_div').slideDown(function() {
			$('#zip_input_text').focus();
		});
	});
	
	/***************
	* Start
	****************/
	
	// initialize JQueryUI tab widget
	$('#tabs').tabs({
		activate: function (event, ui) {
			// the first time this tab is viewed, create google map
			if (ui.newPanel.is('#google_map_canvas') && !zip.mapExists) {
				zip.mapExists = true;	
				zip.drawMap();
				zip.startGeocode();
			}
			// the first time this tab is viewed, create google earth obj
			else if (ui.newPanel.is('#google_earth') && !zip.geExists) {
				zip.geExists = true;	// this flag is just to make sure only 1 ge object gets created
				google.earth.createInstance('google_earth', zip.geComplete, zip.geFail);
			}
		}
	});
	
	// reveal user input area
	$('#input_div').slideDown(function() {
		$('#zip_input_text').focus();
	});
});