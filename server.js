var express = require('express');
var http = require('http');
var socketIO = require('socket.io');

// Создаем HTTP-сервер через Express
var app = express();
var server = http.createServer(app);

// Подключаем Socket.IO к нашему серверу
const io = socketIO(server);

var players = {};

var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};
 
app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('подключился пользователь');
  // создание нового игрока и добавление го в объект players
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // отправляем объект players новому игроку
  socket.emit('currentPlayers', players);
  // отправляем объект star новому игроку
  socket.emit('starLocation', star);
  // отправляем текущий счет
  socket.emit('scoreUpdate', scores);
  // обновляем всем другим игрокам информацию о новом игроке
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('disconnect', function () {
    console.log('пользователь отключился');
    // удаляем игрока из нашего объекта players 
    delete players[socket.id];
    // отправляем сообщение всем игрокам, чтобы удалить этого игрока
    io.emit('disconnect', socket.id);
  });

  // когда игроки движутся, то обновляем данные по ним
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // отправляем общее сообщение всем игрокам о перемещении игрока
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });

});
 
server.listen(8081, function () {
  console.log(`Прослушиваем ${server.address().port}`);
});
