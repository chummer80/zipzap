$(document).ready(function() {
	/***************
	* Constants
	****************/
	
	var DEBUG = true;
	var ENTER_KEY_CODE = 13;
	
	var ZIPTASTIC_API_URL = 'http://ZiptasticAPI.com/';
	
	var WUNDERGROUND_API_URL = 'http://api.wunderground.com/api/';
	var WUNDERGROUND_API_KEY = '96b52a67f7730e2e';
	
	/***************
	* Variables
	****************/
	
	var zipCode = 00000;
	var showingResults = false;
	
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

	var startAJAX = function startAJAX(zip) {
		// change the heading of the results panel
		$('#zipcode').text(zip);
			
		var wUndergroundFullURL = WUNDERGROUND_API_URL + WUNDERGROUND_API_KEY + 
			'/conditions/q/' + zip + '.json';
			
		$.ajax(wUndergroundFullURL, {dataType: 'jsonp'})
			.done(function(data) {
				debug("WUnderground API SUCCESS");
				
				var wUnderground_results = $('#results_templates #wunderground_results').clone();
				
				if (data.response.error) {
					wUnderground_results.find('#location').text(data.response.error.description);
				}
				else {
					var current = data.current_observation;
					
					var locationString = toTitleCase(current.display_location.city) + ", " + current.display_location.state + ", " + current.display_location.country;
					debug("location is " + locationString);
					wUnderground_results.find('#location').text(locationString);
					
					var coordinateString = current.display_location.latitude + ", " + current.display_location.longitude;
					wUnderground_results.find('#coordinates').text("Coordinates: " + coordinateString);
					
					wUnderground_results.find('#temperature').text("Temperature: " + current.temperature_string);
					wUnderground_results.find('#weather').text("Weather: " + current.weather);
					wUnderground_results.find('#weather_icon').attr('src', current.icon_url);
					wUnderground_results.find('#weather_icon').attr('alt', current.icon + " icon");
				}
				wUnderground_results.appendTo($('#results'));			
				
				showResults();
			})
			.fail(function() {
				debug("WUnderground API FAIL");
			});
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
			startAJAX(zipCode);
		}
	});
	
	
	/***************
	* Start
	****************/
	
	$('#input_div').slideDown();
});