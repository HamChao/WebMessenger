var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// Store all CSS in css folder
app.use(express.static('css'));

// For conver markdown
var md = require("node-markdown").Markdown;

// Store chat history
var messages = [];
var users = [];

// Store chat history method
var storeMsg = function(author, msg){
	messages.push({
		author: author,
		msg: msg
	});
	if(messages.length > 100){
		messages.shift();
	}
}

var storeUser = function(username){
	users.push({username: username});
}
var removeUser = function(username){
	for (i=0; i<users.length; i++){
		if(users[i].username == username){
			users.splice(i,1);
			break;
		}
	}
};

// Message format
var msgFormat = function(author, msg){
	var content = "<li><span class='author'>" + author + "</span><span class='msg-body'>"  
	+ md(msg) + "</span></li>";
	return content;
}

io.on('connection', function(client){
	console.log("Client connected.");

	// Print chat history
	messages.forEach(function(message){
		client.emit('messages', msgFormat(message.author, message.msg));
	});

	users.forEach(function(user){
		client.emit('add chatter', user.username);
	});

	// Sent/Receive chat messages
	client.on('messages', function(message){
		console.log(message);
		var username = client.username;
		client.emit('messages', msgFormat(username, message));
		client.broadcast.emit('messages', msgFormat(username, message));
		storeMsg(username, message);
	});

	// Assign username value
	client.on('join', function(username){
		client.username = username;
		client.emit('add chatter', username);
		client.broadcast.emit('add chatter', username);
		storeUser(username);
	});

	client.on('disconnect', function(){
		console.log(client.username);
		client.emit('remove chatter', client.username);
		client.broadcast.emit('remove chatter', client.username);
		removeUser(client.username);
	});

});

// Connect to index.html
app.get('/', function(request, response){
	response.sendFile(__dirname + '/index.html');
});

server.listen(8080);