var express = require("express");
var app = express();


var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);
io.on('connection', (socket) => {
	console.log("hello");
	socket.emit("aa", {});
	socket.on('bb', (data) => {
		socket.emit('recu', {});
	});
});






