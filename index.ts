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
  name?: string
  message: string
}

let cnt = - 1;
const nameObj: any = {};
const roomObj: any = {};
  
io.on('connection', (socket: any) => {
  console.log(`${socket.id} Connected`);

  socket.emit('connected');

  if (!nameObj[socket.id]) {
    let name = `user${++cnt}`;
    nameObj[socket.id] = name;
    
    io.emit('receive-msg', { message: `${cnt}번째 사람이 입장했습니다! (대화명: ${name})` });
    io.to(socket.id).emit('receive-name', { name: nameObj[socket.id], cnt });
  }
  
  socket.on('update-name', (params: name = { name: '' }) => {
    const { name } = params;
    const temp = nameObj[socket.id];
    nameObj[socket.id] = name;
    io.emit('receive-msg', { message: `대화명이 '${temp}'에서 '${name}'(으)로 바뀌었습니다!` });
  });

  socket.on('send-msg', (params: message = { message: '' }) => {
    const res = { ...params, name: nameObj[socket.id] };
    io.emit('receive-msg', res);
  });

  // Random chat room
  socket.on('req-join-room', () => {
    const keys = Object.keys(roomObj);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] != roomObj[keys[i]]) continue; // socket의 id가 room id가 아닐 때
      else { // socket의 id가 room id일 때
        socket.join(keys[i]);
        io.sockets.in(keys[i]).emit('req-join-room-accepted', {});
        const createKey = keys[i];
        roomObj[socket.id] = createKey; // room 호스트, room 게스트 별로 다른 key 사용
        io.sockets.in(roomObj[socket.io]).emit('receive-msg', { message: `랜덤 채팅방을 입장했습니다! (대화명: ${nameObj[socket.io]})` });
        return;
      }
    }
    // 빈 방이 없을 때
    socket.join(socket.id);
    roomObj[socket.id] = socket.id;
    io.sockets.in(roomObj[socket.io]).emit('receive-msg', { message: `랜덤 채팅방을 생성했습니다! (대화명: ${nameObj[socket.io]})` });
  });

  socket.on('req-join-room-canceled', () => {
    socket.leave(roomObj[socket.id]);
  });

  socket.on('send-msg-in-room', (params: message = { message: '' }) => {
    const res = { ...params, name: nameObj[socket.id] };
    io.sockets.in(roomObj[socket.io]).emit('receive-msg', res);
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} Disconnected`);
    const key = roomObj[socket.id];
    socket.leave(key);
    io.emit('disconnected');
    io.sockets.in(key).emit('disconnected');
    delete nameObj[socket.id];
    delete roomObj[key];
  });
});

http.listen(3000, () => {
  console.log('Server is running!');
});