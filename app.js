var express = require('express');					// express module
var app = express();								// initialize express app
var server = require('http').createServer(app);		// create http server
var io = require('socket.io')(server);				// using socket.io in server
var formidable = require('formidable');				// file upload module
var md = require("node-markdown").Markdown;			// markdown module

// Variables
var messages = [];			// store messages
var usernames = [];			// store users
var files_array  = [];		//
var expiryTime = 8;			//

// Static file configuration
app.use(express.static('public/js'));			// import all files in js directory
app.use(express.static('public/css'));			// import all files in css directory
app.use(express.static('public/uploads'));		// import all files in uploads directory

// Server listen on port 8080
server.listen(8080);

// On client connect
io.on('connection', function(socket){
	console.log("Client connected...");

	// Print chat history
	messages.forEach(function(msgContent){
		socket.emit('send message', msgContent);
	});
	// Print username
	usernames.forEach(function(username){
		socket.emit('add user', username);
	});

	// Sent/Receive chat messages
	socket.on('send message', function(message){
		var username = socket.username;
		var msgContent = msgFormat(username, message);
		socket.emit('send message', msgContent);
		socket.broadcast.emit('send message', msgContent);
		storeMsg(msgContent);
	});

	// Assign username value
	socket.on('join', function(username){
		socket.username = username;
		socket.emit('add user', username);
		socket.broadcast.emit('add user', username);
		storeUser(username);
	});

	// Remove user when disconnect
	socket.on('disconnect', function(){
		socket.emit('remove user', socket.username);
		socket.broadcast.emit('remove user', socket.username);
		removeUser(socket.username);
	});

});

// Connect to index.html
app.get('/', function(request, response){
	response.sendFile(__dirname + '/public/index.html');
});

// Upload
app.post('/api/uploadImage',function (req, res){
	var imgdatetimenow = Date.now();
	var form = new formidable.IncomingForm({
      	uploadDir: __dirname + '/public/uploads',
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
		io.sockets.emit('send message', msgContent);
		storeMsg(msgContent);
    });
});


// Method
// Store chat history
var storeMsg = function(msgContent){
	messages.push(msgContent);
	if(messages.length > 100){
		messages.shift();
	}
}

// Store user
var storeUser = function(username){
	usernames.push(username);
}

// Remove user
var removeUser = function(username){
	console.log(username);
	for (i=0; i<usernames.length; i++){
		if(usernames[i] == username){
			usernames.splice(i,1);
			break;
		}
	}
};

// Message format
var msgFormat = function(author, msg){
	var content = "<div class='media'><div class='media-left'><span class='author'>" + author + "</span></div><div class='media-body'><span class='msg-body'>" + md(msg) + "</span></div></div>";
	return content;
}

// Image format
var imgFormat = function(author, imgPath){
	var content = "<div class='media'><div class='media-left'><span class='author'>" + author + "</span></div><div class='media-body'><img src='"+imgPath+"' height='150'></img></div></div>";
	return content;
}

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
