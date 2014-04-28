var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

var users = {};

var redis = require('redis');
var subChat = redis.createClient();
var subUser = redis.createClient();
var pub = redis.createClient();

subChat.subscribe('chat');
subUser.subscribe('user');

io.sockets.on('connection', function(socket) {
    console.log('Socket id --> ' + socket.id);

    socket.on('send', function(data) {
        var data = JSON.parse(data);
        pub.publish('chat', JSON.stringify({ "user": socket.user, "msg": data.msg, "time": data.time }));
    });

    socket.on('join', function(data) {
        var data = JSON.parse(data);
        socket.user = data.user;
        users[socket.id] = { "name": data.user };
        pub.publish('user', JSON.stringify(users));
        pub.publish('chat', JSON.stringify({ "user": data.user, "msg": ' is connected', "time": data.time }));
    });

    subChat.on('message', function(channel, message) {
        console.log('Message from --> ' + channel + ' ' + message + ' ' + socket.user);
        socket.emit(channel, message);
    });

    subUser.on('message', function(channel, message) {
        console.log('Message from --> ' + channel + ' ' + message + ' ' + socket.user);
        socket.emit(channel, message);
    });

    socket.on('disconnect', function() {
        pub.publish('chat', JSON.stringify({ "user": socket.user, "msg": ' is disconnected' }));
        delete users[socket.id];
        pub.publish('user', JSON.stringify(users));
    });
});