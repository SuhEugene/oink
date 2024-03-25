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
  JWT_SECRET
} = process.env;

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = 3001;

app.use(express.json());

app.post('/token', async (req, res) => {
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
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

  jwt.sign();

  const { access_token } = await response.json();
  res.send({ access_token });
});

io.use((socket, next) => {
  const { token } = socket.handshake.auth;
  if (!token) return next(new Error('No token provided!'));

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return next(new Error('Invalid token!'));
  }

  next();
});

io.on('connection', (socket) => {
  socket.on('oink', () => {});
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log(`Client is: ${VITE_DISCORD_CLIENT_ID}`);
  console.log(`Discord secret has ${DISCORD_CLIENT_SECRET.length} symbols`);
  console.log(`JWT secret has ${JWT_SECRET.length} symbols`);
});
