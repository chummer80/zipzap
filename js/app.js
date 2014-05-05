$(document).ready(function() {
	var ENTER_KEY_CODE = 13;
	var ZIPTASTIC_API_URL = 'http://ZiptasticAPI.com/';

	var zipCode = 00000;
	
	/***************
	* Functions
	****************/
	
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

	/***************
	* Event Handlers
	****************/
	
	$('#zip_input_text').keypress(function(event) {
		
		var isDigit = function isDigit (keyCode) {
			console.log("key entered (code): " + keyCode);
			
			var charEntered = String.fromCharCode(keyCode);
			console.log("key entered (char): " + charEntered);
			
			var digitPattern = /^\d+$/;
			return digitPattern.test(charEntered);
		}
		
		if (event.which == ENTER_KEY_CODE) {
			$('#zip_input_button').click();
		}
		else {
			if (isDigit(event.which)) {
				console.log("is digit");
			}
			else {
				console.log("is not digit");				
				event.preventDefault();
			}
		}
	});
	
	$('#zip_input_text').keyup(function() {
		console.log("textbox says: " + this.value);
		$('#zip_input_button').attr('disabled', isInputValid() ? false : true);
	});
		
	$('#zip_input_button').click(function() {
		console.log("ZAP button clicked");
		
		var inputString = this.value;
		if (isInputValid()) {
			zipCode = $('#zip_input_text').val();
			$('#input_div').slideUp();	
			$('#loading').show('blind');
		}
	});
		
	
	
	/***************
	* Start
	****************/
	
	// Automatically show the loading gif when an ajax request is in progress.
	$.ajaxSetup({
		beforeSend: function() {
			// $('#loading').show();
		},
		complete: function(){
			// $('#loading').hide();
		}
	});
	
	$('#input_div').slideDown();
	
	// ZIPTASTIC TEST CODE
 	zipCode = '91356';
	var xhr = $.ajax(ZIPTASTIC_API_URL + zipCode, {dataType: 'jsonp'})
		.done(function(data) {
			console.log("DONE");
			console.log(data);
			
			data.city = toTitleCase(data.city);
			var locationString = toTitleCase(data.city) + ", " + data.state + ", " + data.country;
			console.log("location is " + locationString);
			
			// change the heading of the results panel
			$('#zipcode').text(zipCode);
			
			// clear previous Ziptastic results, then put the new results there instead
			$('#ziptastic_results')
				.empty()
				.html('<p>' + locationString + '</p>');
			
			$('#results').fadeIn();
		})
		.fail(function(data) {
			console.log("FAIL");
		});
		 
});