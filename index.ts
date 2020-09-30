import express from 'express';
import { createServer } from 'http';
import socket from 'socket.io';

const app = express();
const http = createServer(app);
const io = socket(http);

interface name {
  name: string
}

interface message {
  name: string
  message: string
}

let cnt = - 1;
const names: any = {};
const rooms: any = {};
  
io.on('connection', (socket: any) => {
  console.log(`${socket.id} Connected`);

  socket.emit('connected');

  if (!names[socket.id]) {
    let name = `user${++cnt}`;
    names[socket.id] = name;
    
    io.emit('receive-msg', { message: `${cnt}번째 사람이 입장했습니다! (대화명: ${name})` });
    io.to(socket.id).emit('receive-name', { name: names[socket.id], cnt });
  }
  
  socket.on('update-name', (params: name = { name: '' }) => {
    const { name } = params;
    const temp = names[socket.id];
    names[socket.id] = name;
    io.emit('receive-msg', { message: `대화명이 '${temp}'에서 '${name}'(으)로 바뀌었습니다!` });
  });

  socket.on('send-msg', (params: message = { name: '', message: '' }) => {
    io.emit('receive-msg', params);
  });

  // Random chat room
  socket.on('req-join-room', () => {
    const keys = Object.keys(rooms);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] != rooms[keys[i]]) continue; // socket의 id가 room id가 아닐 때
      else { // socket의 id가 room id일 때
        socket.join(keys[i]);
        io.sockets.in(keys[i]).emit('req-join-room-accepted', {});
        const createKey = keys[i];
        rooms[socket.id] = createKey; // room 호스트, room 게스트 별로 다른 key 사용
        return;
      }
    }
    // 빈 방이 없을 때
    socket.join(socket.id);
    rooms[socket.id] = socket.id;
  });

  socket.on('req-join-room-canceled', () => {
    socket.leave(rooms[socket.id]);
  });

  socket.on('send-msg-in-room', (params: message = { name: '', message: '' }) => {
    io.sockets.in(rooms[socket.io]).emit('receive-msg-in-room', params);
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} Disconnected`);
    const key = rooms[socket.id];
    socket.leave(key);
    io.emit('disconnected');
    io.sockets.in(key).emit('disconnected');
    delete names[socket.id];
    delete rooms[key];
  });
});

http.listen(3000, () => {
  console.log('Server is running!');
});