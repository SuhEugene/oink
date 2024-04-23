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
  OINK_SOUNDS_AMOUNT,
  PROXY_PASS
} = process.env;

const proxify = (normalUrl, proxyUrl) => (!PROXY_PASS ? normalUrl : proxyUrl);

const app = express();
const server = createServer(app);
const io = new Server(server, { path: '/socket.io' });
const port = 51533;

app.use(express.json());

app.post(proxify('/api/token', '/token'), async (req, res) => {
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
  res.send({ token, user, discordToken: access_token });
});

io.use((socket, next) => {
  console.log('Socket.IO client trying to connect', socket.id);
  console.log('Socket.IO client auth:', socket.handshake.auth.token);
  const { token } = socket.handshake.auth;
  if (!token) return next(new Error('No token provided!'));

  try {
    const data = jwt.decode(token, JWT_SECRET, { json: true });
    if (!data) return new Error('Invalid token data!');
    socket.data = data;
  } catch (e) {
    return next(new Error('Invalid token!'));
  }

  next();
});

const usersByInstance = new Map();

function addUserToInstance(instance, user) {
  if (!usersByInstance.has(instance)) return usersByInstance.set(instance, [user]);
  usersByInstance.get(instance).push(user);
}

function removeUserFromInstance(instance, user) {
  if (!usersByInstance.has(instance)) return;
  const arr = usersByInstance.get(instance);
  const index = arr.findIndex((el) => el.id === user.id);
  if (index === -1) return;

  arr.splice(index, 1);

  if (arr.length === 0) usersByInstance.delete(instance);
}

io.on('connection', (socket) => {
  console.log('Socket.IO client connected', socket.id);
  const { instance, user } = socket.data;

  io.to(instance).emit('user_connected', user);
  socket.join(instance);
  addUserToInstance(instance, user);

  socket.emit('user_list', usersByInstance.get(instance));

  socket.on('oink', () => {
    const pig = {
      id: Math.random(),
      y: -50 + Math.floor(Math.random() * 100),
      x: -50 + Math.floor(Math.random() * 100),
      turn: Math.floor(Math.random() * 360),
      distance: 100 + Math.floor(Math.random() * 50)
    };
    io.to(instance).emit('oink', {
      user_id: user.id,
      pig,
      sound: Math.floor(Math.random() * OINK_SOUNDS_AMOUNT)
    });
  });
  socket.on('disconnect', () => {
    io.to(instance).emit('user_disconnected', user.id);
    removeUserFromInstance(instance, user);
    console.log('Socket.IO client disconnected', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log(`Client is: ${VITE_DISCORD_CLIENT_ID}`);
  console.log(`Discord secret has ${DISCORD_CLIENT_SECRET.length} symbols`);
  console.log(`JWT secret has ${JWT_SECRET.length} symbols`);
  console.log(`Proxy: ${PROXY_PASS ? 'Enabled' : 'Disabled'}`);
});
