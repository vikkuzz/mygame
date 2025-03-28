import { json } from '@sveltejs/kit';
import { createServer } from 'http';
import { Server } from 'socket.io';

let players = {};
let star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
let scores = {
  blue: 0,
  red: 0
};

const gameHandler = (req, res) => {
  let io = new Server(createServer());

  io.on('connection', (socket) => {
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

    socket.on('disconnect', () => {
      console.log('пользователь отключился');
      // удаляем игрока из нашего объекта players 
      delete players[socket.id];
      // отправляем сообщение всем игрокам, чтобы удалить этого игрока
      io.emit('disconnect', socket.id);
    });

    // когда игроки движутся, то обновляем данные по ним
    socket.on('playerMovement', (movementData) => {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].rotation = movementData.rotation;
      // отправляем общее сообщение всем игрокам о перемещении игрока
      socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    socket.on('starCollected', () => {
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

  return json({
    status: 'ok',
    message: 'Игровой сервер запущен!'
  });
};

export const GET = gameHandler;
