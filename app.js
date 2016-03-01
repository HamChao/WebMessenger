var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var messages = [];

var storeMsg = function(author, msg){
	messages.push({
		author: author,
		msg: msg
	});
	if(messages.length > 100){
		messages.shift();
	}
}

io.on('connection', function(client){
	console.log("Client connected.");
	messages.forEach(function(message){
		client.emit('messages', message.author + ": " + message.msg);
	});
	client.on('messages', function(message){
		console.log(message);
		var username = client.username;
		client.emit('messages', username + ": " + message);
		client.broadcast.emit('messages', username + ": " + message);
		storeMsg(username, message);
	});
	client.on('join', function(username){
		client.username = username;
	});
});


app.get('/', function(request, response){
	response.sendFile(__dirname + '/index.html');
});

server.listen(8080);