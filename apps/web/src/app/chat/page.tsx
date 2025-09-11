"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@repo/ui/button";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3001";
const WS_URL = API_HOST.replace("http", "ws");

interface ChatMessage {
  id: string;
  type: "message" | "user_joined" | "user_left" | "user_list";
  content: string;
  username: string;
  timestamp: number;
  userId?: string;
}

interface User {
  id: string;
  username: string;
}

export default function ChatPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message: ChatMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case "user_list": {
              const userList = JSON.parse(message.content);
              setUsers(userList);
              break;
            }
            case "user_joined":
            case "user_left":
            case "message":
              setMessages(prev => [...prev, message]);
              break;
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setCurrentUsername("");
        setUsers([]);
        console.log("WebSocket disconnected");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error occurred");
      };
    } catch (err) {
      console.error("Error creating WebSocket:", err);
      setError("Failed to connect to chat server");
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setCurrentUsername("");
    setUsers([]);
    setMessages([]);
  };

  const joinChat = () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    if (!isConnected) {
      setError("Not connected to chat server");
      return;
    }

    setIsJoining(true);
    setError(null);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "join",
        username: username.trim()
      }));
      setCurrentUsername(username.trim());
      setUsername("");
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !isConnected || !currentUsername) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        content: message.trim()
      }));
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentUsername) {
        sendMessage();
      } else {
        joinChat();
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageClassName = (msg: ChatMessage) => {
    if (msg.type === "user_joined" || msg.type === "user_left") {
      return "text-blue-600 text-sm italic";
    }
    if (msg.username === currentUsername) {
      return "text-right";
    }
    return "text-left";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-2">
              Real-time Chat Demo
            </h1>
            <p className="text-gray-600">Experience live communication with WebSocket technology</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Connection Status Header */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
                    {isConnected && (
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    <div className="text-xs text-gray-500">
                      {isConnected ? 'WebSocket active' : 'Click to connect'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-700">
                      {users.length} user{users.length !== 1 ? 's' : ''} online
                    </div>
                    <div className="text-xs text-gray-500">Active connections</div>
                  </div>
                  
                  {!isConnected && (
                    <Button onClick={connectWebSocket} size="lg" className="shadow-lg">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Connect to Chat
                    </Button>
                  )}
                  {isConnected && (
                    <Button onClick={disconnectWebSocket} variant="danger" size="lg" className="shadow-lg">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg animate-fade-in">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-red-800">Error</span>
                  </div>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              )}

              {/* Username Input */}
              {isConnected && !currentUsername && (
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Join the Chat</h3>
                      <p className="text-gray-600">Enter your username to start chatting with others</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter your username..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                        disabled={isJoining}
                      />
                      <Button 
                        onClick={joinChat} 
                        disabled={isJoining || !username.trim()}
                        size="lg"
                        className="px-8"
                      >
                        {isJoining ? (
                          <>
                            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Joining...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            Join Chat
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Interface */}
              {currentUsername && (
                <>
                  {/* Online Users */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-700">Online Users</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            user.username === currentUsername
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              user.username === currentUsername ? 'bg-white' : 'bg-green-500'
                            }`}></div>
                            <span>{user.username}</span>
                            {user.username === currentUsername && (
                              <span className="text-xs opacity-75">(You)</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-700">Messages</h3>
                    </div>
                    <div className="h-96 overflow-y-auto border-2 border-gray-200 rounded-xl bg-gradient-to-b from-gray-50 to-white p-4 shadow-inner messages-container">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="text-lg font-medium">No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg, index) => (
                            <div 
                              key={msg.id} 
                              className={`animate-fade-in ${getMessageClassName(msg)}`}
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              {msg.type === "message" && (
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-sm text-gray-700">
                                      {msg.username}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatTimestamp(msg.timestamp)}
                                    </span>
                                    {msg.username === currentUsername && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className={`p-3 rounded-xl shadow-sm ${
                                    msg.username === currentUsername
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-8'
                                      : 'bg-white text-gray-800 mr-8'
                                  }`}>
                                    {msg.content}
                                  </div>
                                </div>
                              )}
                              {(msg.type === "user_joined" || msg.type === "user_left") && (
                                <div className="text-center">
                                  <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {msg.type === "user_joined" ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
                                      )}
                                    </svg>
                                    {msg.content}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!message.trim()}
                      size="lg"
                      className="px-6"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">How to use this demo</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                  <p className="text-gray-700">Click <strong>"Connect to Chat"</strong> to establish a WebSocket connection</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                  <p className="text-gray-700">Enter a username to join the chat room</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                  <p className="text-gray-700">Start typing messages and see them appear in real-time</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                  <p className="text-gray-700">Open multiple browser tabs to see multiple users chatting</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</div>
                  <p className="text-gray-700">Watch as users join and leave the chat with live notifications</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">6</div>
                  <p className="text-gray-700">Enjoy the beautiful animations and real-time experience!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
