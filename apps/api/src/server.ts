import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import { createServer as createHttpServer } from "http";
import { ChatServer } from "./websocket";

let chatServer: ChatServer | null = null;

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .get("/message/:name", (req, res) => {
      return res.json({ message: `hello ${req.params.name}` });
    })
    .get("/status", (_, res) => {
      return res.json({ ok: true });
    })
    .get("/chat/users", (_, res) => {
      return res.json({ 
        connectedUsers: chatServer?.getConnectedUsersCount() || 0,
        message: "WebSocket chat server is running"
      });
    });

  return app;
};

export const createHttpServerWithWebSocket = () => {
  const app = createServer();
  const server = createHttpServer(app);
  
  // Initialize WebSocket server
  chatServer = new ChatServer(server);
  
  return { server, chatServer };
};
