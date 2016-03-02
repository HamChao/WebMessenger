var socket = io.connect('http://localhost:8080');
socket.on('connect', function(){
	var username = '';
	while(username == ''){
		username = prompt("What is your username?");
	}
	$('input[name=username]').val(username);
	socket.emit('join', username)
});
socket.on('send message', function(message){
	$('.chat-body').append(message);
});
socket.on('add user', function(username){
	$('#user_list').append("<p id='" + username + "'>" + username + "</p>");
})
socket.on('remove user', function(username){
	$('#user_list p#'+username).remove();
});
$('#chat_form').submit(function(e){
	var message = $('#message_input').val();
	var attached = $('#attached_input').val();
	if(message != ''){
		socket.emit('send message', message);
		$('#message_input').val('');
	} else if (attached != '') {
		$("#status").empty().text("File is uploading...");
	    $(this).ajaxSubmit({
	        error: function(xhr) {
			    status('Error: ' + xhr.status);
	        },
	        success: function(response) {
			    $("#status").empty().text(response);
	        }
	    });
		$('#attached_input').val('');
	}
	return false;
});