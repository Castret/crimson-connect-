const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Config / DB
const db = require('./config/db');

// Models for Socket.IO handlers
const ChatModel = require('./models/chatModel');
const NotificationModel = require('./models/notificationModel');

// Middleware
const errorMiddleware = require('./middleware/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bloodRoutes = require('./routes/bloodRoutes');
const emergencyRequestsRoutes = require('./routes/emergencyRoutes');


const app = express();

const allowedOrigins = [
  "https://crimson-connect-five.vercel.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options("*", cors());

app.use(helmet({
  crossOriginResourcePolicy: false
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://crimson-connect-five.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.set('socketio', io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// Bind REST routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/emergency-requests', emergencyRequestsRoutes);


// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Crimson Connect API Server is running successfully.' });
});

// Socket.IO Connection Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication error: Token is required'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = decoded;
    next();
  });
});

// Socket.IO Events
io.on('connection', (socket) => {
  const userId = socket.user.id;
  
  // Join personal room for user notifications and chats
  socket.join(`user-${userId}`);
  console.log(`Socket client connected: User ID ${userId}`);

  socket.on('join_chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`User ${userId} joined chat room: ${chatId}`);
  });

  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
    console.log(`User ${userId} left chat room: ${chatId}`);
  });

  socket.on('send_message', async (data) => {
    const { chatId, receiverId, content, imageUrl } = data;
    if (!chatId || !receiverId) return;

    try {
      // Save message to DB
      const messageId = await ChatModel.saveMessage(chatId, userId, content, imageUrl);

      // Fetch saved message with sender profile info
      const [msgRows] = await db.execute(
        `SELECT m.*, pr.name AS sender_name, pr.profile_pic_url AS sender_avatar
         FROM messages m
         JOIN profiles pr ON m.sender_id = pr.user_id
         WHERE m.id = ?`,
        [messageId]
      );
      const savedMessage = msgRows[0];

      // Emit message to everyone in the chat room (includes sender and receiver if they are active in the chat)
      io.to(`chat-${chatId}`).emit('receive_message', savedMessage);

      // Trigger notification for the receiver if they are online but not actively in the chat tab
      io.to(`user-${receiverId}`).emit('message_notification', {
        chatId,
        senderName: savedMessage.sender_name,
        senderAvatar: savedMessage.sender_avatar,
        content: savedMessage.content || 'Sent an image'
      });

      // Create a DB notification
      await NotificationModel.create(receiverId, userId, 'message', chatId);

      // Emit new unread count to receiver
      const unreadCount = await NotificationModel.getUnreadCount(receiverId);
      io.to(`user-${receiverId}`).emit('notification_count', { unreadCount });

    } catch (err) {
      console.error('Socket.IO message handler error:', err);
    }
  });

  socket.on('typing', (data) => {
    const { chatId, isTyping } = data;
    if (!chatId) return;
    socket.to(`chat-${chatId}`).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: User ID ${userId}`);
  });
});

// Global Error Handler Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
