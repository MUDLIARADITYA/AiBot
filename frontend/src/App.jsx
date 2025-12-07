import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

// Backend socket server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

function App() {
  // Chat messages store karne ke liye
  const [messages, setMessages] = useState([]);

  // User input (textarea ke andar text)
  const [input, setInput] = useState('');

  // Socket connected / disconnected status
  const [connected, setConnected] = useState(false);

  // Socket instance ko React ke render cycle se bachane ke liye
  const socketRef = useRef(null);

  // ---------------------- SOCKET CONNECTION ----------------------
  useEffect(() => {
    // Socket.io client connect
    const socket = io(SOCKET_URL, {
      transports: ['websocket'], // WebSocket force for better speed
    });

    // socket ko globally store kar diya (future use ke liye)
    socketRef.current = socket;

    // Jab connection successfully ban jaye
    socket.on('connect', () => {
      setConnected(true);
    });

    // Jab connection toot jaye
    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Backend → AI ka response aata hai (event: ai-response)
    socket.on('ai-response', (payload) => {
      const text = payload?.text ?? JSON.stringify(payload);

      // AI message chat me add kar do
      setMessages((prev) => [...prev, { from: 'ai', text }]);
    });

    // Backend → error message bhejta hai (event: ai-error)
    socket.on('ai-error', (payload) => {
      const text = payload?.message || 'AI request failed';

      // System message dikhana
      setMessages((prev) => [...prev, { from: 'system', text }]);
    });

    // Component unmount hote hi socket cleanup
    return () => {
      socket.disconnect();
    };
  }, []);
  // ----------------------------------------------------------------

  // ---------------------- SEND MESSAGE TO BACKEND ----------------------
  function sendMessage() {
    const text = input.trim();
    if (!text) return; // Empty message nahi bhejna

    // User message UI me show karo
    setMessages((m) => [...m, { from: 'user', text }]);

    // Input box empty kar do
    setInput('');

    // Backend ko event bhejna (event: ai-message)
    socketRef.current?.emit('ai-message', { prompt: text });
  }

  // Enter press → message send
  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // new line add na ho
      sendMessage();
    }
  }
  // ---------------------------------------------------------------------

  return (
    <div className="chat-root">
      <header className="chat-header">
        <h2>AI Chat</h2>

        {/* Connected / Disconnected Status */}
        <div className={`status ${connected ? 'online' : 'offline'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="chat-main" id="chatScroll">
        {/* If no messages */}
        {messages.length === 0 && (
          <div className="empty">
            Say hi — type a message and press Enter or Send
          </div>
        )}  

        {/* Chat message list */}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </main>

      <footer className="chat-footer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message..."
          rows={2}
        />
        <button onClick={sendMessage} className="send">
          Send
        </button>
      </footer>
    </div>
  );
}

export default App;
