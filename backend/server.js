require('dotenv').config();

// Express app import
const app = require('./src/app');

// HTTP server banane ke liye (Socket.io ko raw HTTP server chahiye hota hai)
const { createServer } = require("http");

// Socket.io import
const { Server } = require("socket.io");

// Gemini/Ai response function
const generateResponse = require('./src/services/ai.service');

// Express app ko HTTP server me convert kar rahe hain
const httpServer = createServer(app);

// Frontend URL env se ya default localhost
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Socket.io ko backend server ke upar attach karna + CORS allow
const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,   // Sirf ye frontend connect kar sakta hai
        credentials: true,      // Cookies, headers allow
    },
});

// Jab koi user socket se connect kare
io.on("connection", (socket) => {
    console.log("A user Connected");

    // Jab user disconnect ho jaye
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });

    // Frontend se AI ke liye message aata hai (event name: ai-message)
    socket.on("ai-message", async (data) => {
        console.log("Received AI message:", data?.prompt);   // user ka prompt

        try {
            // Gemini ya AI response generate karna
            const response = await generateResponse(data?.prompt);

            console.log("AI Response sent:", response);

            // AI ka reply frontend ko bhejna (event: ai-response)
            socket.emit("ai-response", { text: response });

        } catch (err) {
            console.error("AI error:", err?.message);

            // Agar AI fail ho jaye to error frontend ko bhejna
            socket.emit("ai-error", {
                message: err?.message || "AI request failed"
            });
        }
    });

});

// Backend server port 3000 par run karna
httpServer.listen(3000, () => {
    console.log("Server is running on port 3000");
});
