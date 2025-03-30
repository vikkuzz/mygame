import { Server as SocketIoServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export default async function handler(req, res) {
  if (!res.socket.server.io) {
    const httpServer = new HttpServer(res.socket.server);
    const io = new SocketIoServer(httpServer, {
      path: '/socket.io/',
      serveClient: false,
      cors: {
        origin: '*'
      }
    });

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
