const ChatModel = require('../models/chatModel');
const db = require('../config/db');

const ChatController = {
  getOrCreateChat: async (req, res, next) => {
    try {
      const userId1 = req.user.id;
      const { userId2 } = req.body;

      if (!userId2) {
        return res.status(400).json({ message: 'Target user ID is required' });
      }

      if (Number(userId1) === Number(userId2)) {
        return res.status(400).json({ message: 'You cannot start a chat with yourself' });
      }

      const chatId = await ChatModel.getOrCreateChat(userId1, Number(userId2));
      res.status(200).json({ chatId });
    } catch (err) {
      next(err);
    }
  },

  getUserChats: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const chats = await ChatModel.getUserChats(userId);
      res.json(chats);
    } catch (err) {
      next(err);
    }
  },

  getMessages: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const chatId = Number(req.params.id);

      // Verify the user is part of this chat
      const [chatRows] = await db.execute(
        'SELECT user_id_1, user_id_2 FROM chats WHERE id = ?',
        [chatId]
      );

      if (chatRows.length === 0) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      const chat = chatRows[0];
      if (chat.user_id_1 !== userId && chat.user_id_2 !== userId) {
        return res.status(403).json({ message: 'Unauthorized to view this chat' });
      }

      const messages = await ChatModel.getMessages(chatId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const chatId = Number(req.params.id);

      await ChatModel.markAsRead(chatId, userId);
      res.json({ message: 'Messages marked as read' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ChatController;
