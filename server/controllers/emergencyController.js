const db = require('../config/db');

const EmergencyController = {
  create: async (req, res, next) => {
    try {
      const hospitalId = req.user.id;
      const role = req.user.role;

      if (role !== 'hospital') {
        return res.status(403).json({ message: 'Action denied: Only hospital role can create emergency requests' });
      }

      const { blood_type_needed, patient_info } = req.body;

      if (!blood_type_needed) {
        return res.status(400).json({ message: 'Blood type needed is required' });
      }

      // Fetch hospital profile name
      const [[hospitalProfile]] = await db.execute('SELECT name FROM profiles WHERE user_id = ?', [hospitalId]);
      const hospitalName = hospitalProfile ? hospitalProfile.name : 'A Hospital';

      // Insert emergency request
      const [insertRes] = await db.execute(
        'INSERT INTO emergency_requests (hospital_id, blood_type_needed, patient_info, status) VALUES (?, ?, ?, "active")',
        [hospitalId, blood_type_needed, patient_info || null]
      );
      const requestId = insertRes.insertId;

      // Find matching donors (by u.blood_type or profiles.blood_group) and all blood banks
      const [donors] = await db.execute(
        `SELECT u.id FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.role = 'donor' AND (u.blood_type = ? OR p.blood_group = ?)`,
        [blood_type_needed, blood_type_needed]
      );

      const [bloodbanks] = await db.execute(
        "SELECT id FROM users WHERE role = 'bloodbank'"
      );

      // Collect unique recipient IDs
      const recipientIds = new Set();
      donors.forEach(d => recipientIds.add(d.id));
      bloodbanks.forEach(b => recipientIds.add(b.id));
      recipientIds.delete(hospitalId); // Avoid sending to self

      const io = req.app.get('socketio');
      const messageContent = `EMERGENCY ALERT: ${blood_type_needed} blood urgently needed at ${hospitalName}.${patient_info ? ' Patient Note: ' + patient_info : ''}`;

      for (const recipientId of recipientIds) {
        // Find or create chat
        const uid1 = Math.min(hospitalId, recipientId);
        const uid2 = Math.max(hospitalId, recipientId);

        let [chatRows] = await db.execute('SELECT id FROM chats WHERE user_id_1 = ? AND user_id_2 = ?', [uid1, uid2]);
        let chatId;
        if (chatRows.length > 0) {
          chatId = chatRows[0].id;
        } else {
          const [insertChat] = await db.execute('INSERT INTO chats (user_id_1, user_id_2) VALUES (?, ?)', [uid1, uid2]);
          chatId = insertChat.insertId;
        }

        // Insert message
        const [insertMsg] = await db.execute(
          'INSERT INTO messages (chat_id, sender_id, content, type, is_read) VALUES (?, ?, ?, "emergency_alert", FALSE)',
          [chatId, hospitalId, messageContent]
        );
        const messageId = insertMsg.insertId;

        // Emit Socket.IO event if recipient is online
        if (io) {
          const [msgRows] = await db.execute(
            `SELECT m.*, pr.name AS sender_name, pr.profile_pic_url AS sender_avatar
             FROM messages m
             JOIN profiles pr ON m.sender_id = pr.user_id
             WHERE m.id = ?`,
            [messageId]
          );
          if (msgRows.length > 0) {
            const savedMessage = msgRows[0];
            io.to(`chat-${chatId}`).emit('receive_message', savedMessage);
            io.to(`user-${recipientId}`).emit('message_notification', {
              chatId,
              senderName: savedMessage.sender_name,
              senderAvatar: savedMessage.sender_avatar,
              content: savedMessage.content
            });
          }
        }
      }

      res.status(201).json({
        message: 'Emergency request broadcasted successfully',
        requestId,
        blood_type_needed,
        patient_info
      });
    } catch (err) {
      next(err);
    }
  },

  fulfill: async (req, res, next) => {
    try {
      const hospitalId = req.user.id;
      const { id } = req.params;

      const [reqRows] = await db.execute('SELECT * FROM emergency_requests WHERE id = ?', [id]);
      if (reqRows.length === 0) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }

      const emergencyRequest = reqRows[0];

      if (Number(emergencyRequest.hospital_id) !== Number(hospitalId)) {
        return res.status(403).json({ message: 'Action denied: You are not authorized to fulfill this request' });
      }

      if (emergencyRequest.status === 'fulfilled') {
        return res.status(409).json({ message: 'Conflict: This emergency request has already been fulfilled' });
      }

      // Update status in DB
      await db.execute(
        'UPDATE emergency_requests SET status = "fulfilled", fulfilled_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      // Fetch hospital profile name
      const [[hospitalProfile]] = await db.execute('SELECT name FROM profiles WHERE user_id = ?', [hospitalId]);
      const hospitalName = hospitalProfile ? hospitalProfile.name : 'A Hospital';

      // Find matching donors and blood banks to broadcast resolution
      const [donors] = await db.execute(
        `SELECT u.id FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.role = 'donor' AND (u.blood_type = ? OR p.blood_group = ?)`,
        [emergencyRequest.blood_type_needed, emergencyRequest.blood_type_needed]
      );

      const [bloodbanks] = await db.execute(
        "SELECT id FROM users WHERE role = 'bloodbank'"
      );

      const recipientIds = new Set();
      donors.forEach(d => recipientIds.add(d.id));
      bloodbanks.forEach(b => recipientIds.add(b.id));
      recipientIds.delete(hospitalId);

      const io = req.app.get('socketio');
      const resolutionContent = `EMERGENCY RESOLVED: Blood acquired for patient at ${hospitalName} — thank you for your support.`;

      for (const recipientId of recipientIds) {
        const uid1 = Math.min(hospitalId, recipientId);
        const uid2 = Math.max(hospitalId, recipientId);

        let [chatRows] = await db.execute('SELECT id FROM chats WHERE user_id_1 = ? AND user_id_2 = ?', [uid1, uid2]);
        if (chatRows.length > 0) {
          const chatId = chatRows[0].id;

          // Insert resolution message
          const [insertMsg] = await db.execute(
            'INSERT INTO messages (chat_id, sender_id, content, type, is_read) VALUES (?, ?, ?, "emergency_resolved", FALSE)',
            [chatId, hospitalId, resolutionContent]
          );
          const messageId = insertMsg.insertId;

          // Emit Socket event
          if (io) {
            const [msgRows] = await db.execute(
              `SELECT m.*, pr.name AS sender_name, pr.profile_pic_url AS sender_avatar
               FROM messages m
               JOIN profiles pr ON m.sender_id = pr.user_id
               WHERE m.id = ?`,
              [messageId]
            );
            if (msgRows.length > 0) {
              const savedMessage = msgRows[0];
              io.to(`chat-${chatId}`).emit('receive_message', savedMessage);
              io.to(`user-${recipientId}`).emit('message_notification', {
                chatId,
                senderName: savedMessage.sender_name,
                senderAvatar: savedMessage.sender_avatar,
                content: savedMessage.content
              });
            }
          }
        }
      }

      res.json({ message: 'Emergency request marked as fulfilled' });
    } catch (err) {
      next(err);
    }
  },

  getOwn: async (req, res, next) => {
    try {
      const hospitalId = req.user.id;
      const role = req.user.role;

      if (role !== 'hospital') {
        return res.status(403).json({ message: 'Action denied: Only hospital role can retrieve own requests' });
      }

      const [rows] = await db.execute(
        'SELECT * FROM emergency_requests WHERE hospital_id = ? ORDER BY created_at DESC',
        [hospitalId]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = EmergencyController;
