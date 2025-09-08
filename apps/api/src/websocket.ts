import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { log } from "@repo/logger";

export interface ChatMessage {
  id: string;
  type: "message" | "user_joined" | "user_left" | "user_list";
  content: string;
  username: string;
  timestamp: number;
  userId?: string;
}

export interface User {
  id: string;
  username: string;
  ws: WebSocket;
}

class ChatServer {
  private wss: WebSocketServer;
  private users: Map<string, User> = new Map();
  private messageHistory: ChatMessage[] = [];
  private nextUserId = 1;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const userId = `user_${this.nextUserId++}`;
      log(`New WebSocket connection: ${userId}`);

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, userId, message);
        } catch (error) {
          log(`Error parsing message from ${userId}:`, error);
          this.sendError(ws, "Invalid message format");
        }
      });

      ws.on("close", () => {
        this.handleUserDisconnect(userId);
      });

      ws.on("error", (error) => {
        log(`WebSocket error for ${userId}:`, error);
        this.handleUserDisconnect(userId);
      });

      // Send welcome message and current user list
      this.sendMessage(ws, {
        id: this.generateMessageId(),
        type: "user_joined",
        content: "Welcome to the chat!",
        username: "System",
        timestamp: Date.now(),
        userId: "system"
      });

      this.sendUserList(ws);
    });
  }

  private handleMessage(ws: WebSocket, userId: string, message: any) {
    switch (message.type) {
      case "join":
        this.handleUserJoin(ws, userId, message.username);
        break;
      case "message":
        this.handleChatMessage(userId, message.content);
        break;
      default:
        this.sendError(ws, "Unknown message type");
    }
  }

  private handleUserJoin(ws: WebSocket, userId: string, username: string) {
    if (!username || username.trim().length === 0) {
      this.sendError(ws, "Username is required");
      return;
    }

    const trimmedUsername = username.trim();
    
    // Check if username is already taken
    const existingUser = Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (existingUser) {
      this.sendError(ws, "Username already taken");
      return;
    }

    // Add user
    this.users.set(userId, {
      id: userId,
      username: trimmedUsername,
      ws
    });

    // Notify all users about new user
    const joinMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: "user_joined",
      content: `${trimmedUsername} joined the chat`,
      username: "System",
      timestamp: Date.now(),
      userId: "system"
    };

    this.broadcastMessage(joinMessage);
    this.broadcastUserList();

    // Send message history to new user
    this.sendMessageHistory(ws);

    log(`User ${trimmedUsername} (${userId}) joined the chat`);
  }

  private handleChatMessage(userId: string, content: string) {
    const user = this.users.get(userId);
    if (!user) {
      return;
    }

    if (!content || content.trim().length === 0) {
      return;
    }

    const message: ChatMessage = {
      id: this.generateMessageId(),
      type: "message",
      content: content.trim(),
      username: user.username,
      timestamp: Date.now(),
      userId: user.id
    };

    // Store message in history (keep last 100 messages)
    this.messageHistory.push(message);
    if (this.messageHistory.length > 100) {
      this.messageHistory.shift();
    }

    this.broadcastMessage(message);
    log(`Message from ${user.username}: ${content}`);
  }

  private handleUserDisconnect(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      
      const leaveMessage: ChatMessage = {
        id: this.generateMessageId(),
        type: "user_left",
        content: `${user.username} left the chat`,
        username: "System",
        timestamp: Date.now(),
        userId: "system"
      };

      this.broadcastMessage(leaveMessage);
      this.broadcastUserList();
      
      log(`User ${user.username} (${userId}) left the chat`);
    }
  }

  private sendMessage(ws: WebSocket, message: ChatMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      id: this.generateMessageId(),
      type: "message",
      content: `Error: ${error}`,
      username: "System",
      timestamp: Date.now(),
      userId: "system"
    });
  }

  private sendUserList(ws: WebSocket) {
    const userListMessage: ChatMessage = {
      id: this.generateMessageId(),
      type: "user_list",
      content: JSON.stringify(Array.from(this.users.values()).map(u => ({
        id: u.id,
        username: u.username
      }))),
      username: "System",
      timestamp: Date.now(),
      userId: "system"
    };

    this.sendMessage(ws, userListMessage);
  }

  private sendMessageHistory(ws: WebSocket) {
    this.messageHistory.forEach(message => {
      this.sendMessage(ws, message);
    });
  }

  private broadcastMessage(message: ChatMessage) {
    this.users.forEach(user => {
      this.sendMessage(user.ws, message);
    });
  }

  private broadcastUserList() {
    this.users.forEach(user => {
      this.sendUserList(user.ws);
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getConnectedUsersCount(): number {
    return this.users.size;
  }
}

export { ChatServer };
