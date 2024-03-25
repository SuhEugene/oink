import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '../.env' });

const {
  VITE_DISCORD_CLIENT_ID, //
  DISCORD_CLIENT_SECRET,
  JWT_SECRET,
  OINK_SOUNDS_AMOUNT
} = process.env;

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = 51533;

app.use(express.json());

app.post('/api/token', async (req, res) => {
  if (!req.body.code) return res.status(400).json({ message: 'No code provided' });

  if (!req.body.instance || typeof req.body.instance !== 'string')
    return res.status(400).json({ message: 'No instance provided' });

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: VITE_DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: req.body.code
    })
  });

  const { token_type, access_token } = await tokenResponse.json();

  const userResponse = await fetch('https://discord.com/api/users/@me', {
    method: 'GET',
    headers: { Authorization: `${token_type} ${access_token}` }
  });

  const userData = await userResponse.json();
  const user = {
    id: userData.id,
    username: userData.username,
    global_name: userData.global_name,
    avatar: userData.avatar
  };

  const token = jwt.sign({ user, instance: req.body.instance }, JWT_SECRET);
  res.send({ token, user });
});

// io.use((socket, next) => {
//   // const { token } = socket.handshake.auth;
//   // if (!token) return next(new Error('No token provided!'));

//   // try {
//   //   const data = jwt.decode(token, JWT_SECRET, { json: true });
//   //   if (!data) return new Error('Invalid token data!');
//   //   socket.data = data;
//   // } catch (e) {
//   //   return next(new Error('Invalid token!'));
//   // }

//   next();
// });

io.on('connection', (socket) => {
  console.log('Socket.IO client connected', socket.id);
  socket.on('oink', () => {
    console.log('Socket data', socket.data);
    // io.in('a').emit('oink', {
    //   user: '123',
    //   sound: Math.floor(Math.random() * OINK_SOUNDS_AMOUNT)
    // });
  });
  socket.on('disconnect', () => console.log('Socket.IO client disconnected', socket.id));
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log(`Client is: ${VITE_DISCORD_CLIENT_ID}`);
  console.log(`Discord secret has ${DISCORD_CLIENT_SECRET.length} symbols`);
  console.log(`JWT secret has ${JWT_SECRET.length} symbols`);
});
