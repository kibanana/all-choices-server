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
  
io.on('connection', (socket: any) => {
  console.log(`${socket.id} Connected`);

  if (names[socket.id]) {
    let name = `user${++cnt}`;
    names[socket.id] = name;
    io.to(socket.id).emit('receive-name', { name: names[socket.id] || 'unknown', cnt });
  }

  socket.on('update-name', (params: name = { name: '' }) => {
    const { name } = params;
    const temp = names[socket.id];
    names[socket.id] = name;
    io.emit('receive-msg', `제 이름이 '${temp}' => '${name}'(으)로 바뀌었습니다!`);
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} Disconnected`);
  });

  socket.on('send-msg', (params: message = { name: '', message: '' }) => {
    io.emit('receive-msg', params);
  });
});

http.listen(3000, () => {
  console.log('Server is running!');
});