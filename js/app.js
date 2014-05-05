$(document).ready(function() {
	var ENTER_KEY_CODE = 13;
	var ZIPTASTIC_API_URL = 'http://ZiptasticAPI.com/';

	
	
	/***************
	* Functions
	****************/
	
	var isInputValid = function isInputValid() {
		var inputString = $('#zip_input_text').val();
		return /^\d{5}$/.test(inputString);
	};
	
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
			$('#input_div').slideUp(null, function() {
				$('#loading').show();
			});	
		}
		
	});
		
	
	
	/***************
	* Start
	****************/
	
	// Automatically show the loading gif when an ajax request is in progress.
	$.ajaxSetup({
		beforeSend: function() {
			$('#loading').show();
		},
		complete: function(){
			$('#loading').hide();
		}
	});
	
	$('#input_div').slideDown();
	
	// ZIPTASTIC TEST CODE
	var zipCode = '90210';
	var xhr = $.ajax(ZIPTASTIC_API_URL + zipCode, {dataType: 'jsonp'})
		.done(function(data) {
			console.log("DONE");
			console.log(data);
			console.log("city is " + data.city);
		})
		.fail(function(data) {
			console.log("FAIL");
		});
		
});