// Parse query string to extract some parameters (it can fail for some input)
	var query = document.location.href.replace(/^[^?]*(\?([^#]*))?(#.*)?/, '$2');
	var queryParams = query ? JSON.parse('{' + query.split('&').map(function (a) {
	  return a.split('=').map(decodeURIComponent).map(JSON.stringify).join(': ');
	}).join(',') + '}') : {};

	

	$(window).ready(function() {
		$('#flipbook').turn({
							display: 'double',
							acceleration: true,
							gradients: true,
							elevation:50,
							autoCenter: true,
							width: 1200,
							height: 800,
							when: {
								turned: function(e, page) {
									/*console.log('Current view: ', $(this).turn('view'));*/
								}
							}
						});
	});
	
	
	$(window).bind('keydown', function(e){
		
		if (e.keyCode==37)
			$('#flipbook').turn('previous');
		else if (e.keyCode==39)
			$('#flipbook').turn('next');
			
	});
