import { randomUUID } from "node:crypto";
import http from "node:http";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoPretty from "pino-pretty";
import WebSocket, { WebSocketServer } from "ws";

const app = express();
const logger = pino(pinoPretty());

app.use(cors());
app.use(express.json());

const userState = [];

app.post("/new-user", (request, response) => {
  const { name } = request.body || {};

  if (typeof name !== "string" || !name.trim()) {
    return response.status(400).json({
      status: "error",
      message: "Name is required!",
    });
  }

  const normalizedName = name.trim();

  const isExist = userState.find((user) => user.name === normalizedName);

  if (isExist) {
    const result = {
      status: "error",
      message: "This name is already taken!",
    };

    logger.error(`User with name "${normalizedName}" already exists`);

    return response.status(409).json(result);
  }

  const newUser = {
    id: randomUUID(),
    name: normalizedName,
  };

  userState.push(newUser);

  const result = {
    status: "ok",
    user: newUser,
  };

  logger.info(`New user created: ${JSON.stringify(newUser)}`);

  return response.status(200).json(result);
});

const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

const broadcast = (data) => {
  [...wsServer.clients]
    .filter((client) => client.readyState === WebSocket.OPEN)
    .forEach((client) => client.send(JSON.stringify(data)));
};

wsServer.on("connection", (ws) => {
  broadcast(userState);

  ws.on("message", (msg) => {
    let receivedMSG;

    try {
      receivedMSG = JSON.parse(msg.toString());
    } catch (error) {
      logger.error(`Invalid message: ${error.message}`);
      return;
    }

    logger.info(`Message received: ${JSON.stringify(receivedMSG)}`);

    if (receivedMSG.type === "exit") {
      const idx = userState.findIndex(
        (user) => user.id === receivedMSG.user?.id
      );

      if (idx !== -1) {
        const [deletedUser] = userState.splice(idx, 1);

        broadcast(userState);

        logger.info(`User with name "${deletedUser.name}" has been deleted`);
      }

      return;
    }

    if (receivedMSG.type === "send") {
      [...wsServer.clients]
        .filter((client) => client.readyState === WebSocket.OPEN)
        .forEach((client) => client.send(msg.toString()));

      logger.info("Message sent to all users");
    }
  });
});

const port = process.env.PORT || 3000;

server.on("error", (error) => {
  logger.error(`Server error: ${error.message}`);
});

server.listen(port, () => {
  logger.info(`Server has been started on http://localhost:${port}`);
});
