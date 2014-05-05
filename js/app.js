$(document).ready(function() {
	var DEBUG = true;
	var ENTER_KEY_CODE = 13;
	var ZIPTASTIC_API_URL = 'http://ZiptasticAPI.com/';

	var zipCode = 00000;
	
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
		// Ziptastic http request
		var xhr = $.ajax(ZIPTASTIC_API_URL + zip, {dataType: 'jsonp'})
			.done(function(data) {
				debug("DONE");
				debug(data);
				
				// change the heading of the results panel
				$('#zipcode').text(zip);
				
				if (data.error) {
					$('#ziptastic_results')
						.empty()
						.html('<p>' + data.error + '</p>');
				}
				else {
					data.city = toTitleCase(data.city);
					var locationString = toTitleCase(data.city) + ", " + data.state + ", " + data.country;
					debug("location is " + locationString);
					
					// clear previous Ziptastic results, then put the new results there instead
					$('#ziptastic_results')
						.empty()
						.html('<p>' + locationString + '</p>');
				}
				
				showResults();
			})
			.fail(function(data) {
				debug("FAIL");
			});
	};
	
	var showResults = function showResults() {
		// $('#loading').hide('blind', {direction: 'down'});
		$('#loading').hide();
		$('#results').fadeIn();
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