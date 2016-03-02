var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var formidable = require('formidable');

// Store all CSS in css folder
app.use(express.static('css'));
app.use(express.static('uploads'));

// For convert to markdown
var md = require("node-markdown").Markdown;

// Store chat history
var messages = [];
// Store users
var users = [];
var files_array  = [];
var expiryTime = 8;


// Store chat history method
// var storeMsg = function(author, msg){
// 	messages.push({
// 		author: author,
// 		msg: msg
// 	});
// 	if(messages.length > 100){
// 		messages.shift();
// 	}
// }
var storeMsg = function(msgContent){
	messages.push(msgContent);
	if(messages.length > 100){
		messages.shift();
	}
}

// Store user method
var storeUser = function(username){
	users.push({username: username});
}
// Remove user Method
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
var imgFormat = function(author, imgPath){
	var content = "<li><span class='author'>" + author + "</span><img src='"+imgPath+"' height='150'></img></li>";
	return content;
}

io.on('connection', function(client){
	console.log("Client connected.");

	// Print chat history
	messages.forEach(function(msgContent){
		client.emit('messages', msgContent);
	});

	users.forEach(function(user){
		client.emit('add chatter', user.username);
	});

	// Sent/Receive chat messages
	client.on('messages', function(message){
		console.log(message);
		var username = client.username;
		var msgContent = msgFormat(username, message);
		client.emit('messages', msgContent);
		client.broadcast.emit('messages', msgContent);
		storeMsg(msgContent);
	});

	// Assign username value
	client.on('join', function(username){
		client.username = username;
		client.emit('add chatter', username);
		client.broadcast.emit('add chatter', username);
		storeUser(username);
	});

	// Remove user when disconnect
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








// Upload
// route for uploading images asynchronously
app.post('/api/uploadImage',function (req, res){
	var imgdatetimenow = Date.now();
	var form = new formidable.IncomingForm({
      	uploadDir: __dirname + '/uploads',
      	keepExtensions: true
	});

	form.on('end', function() {
      res.end();
    });
    
    form.parse(req,function(err,fields,files){
		var data = { 
				username : fields.username, 
				userAvatar : fields.userAvatar, 
				repeatMsg : true, 
				hasFile : fields.hasFile, 
				isImageFile : fields.isImageFile, 
				istype : fields.istype, 
				showme : fields.showme, 
				dwimgsrc : fields.dwimgsrc, 
				dwid : fields.dwid,
				serverfilename : baseName(files.attached.path), 
				msgTime : fields.msgTime,
				filename : files.attached.name,
				size : bytesToSize(files.attached.size)
		};
	    var image_file = { 
		        dwid : fields.dwid,
		        filename : files.attached.name,
		        filetype : fields.istype,
		        serverfilename : baseName(files.attached.path),
		        serverfilepath : files.attached.path,
		        expirytime : imgdatetimenow + (3600000 * expiryTime)           
	    };
	    files_array.push(image_file);
	    var msgContent = imgFormat(data.username ,data.serverfilename);
		io.sockets.emit('messages', msgContent);
		storeMsg(msgContent);
    });
});

// Size Conversion
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i]; 
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};
//get file name from server file path
function baseName(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1);     
   return base;
}
