const db = require('../config/db');
const LogModel = require('../models/logModel');
const NotificationModel = require('../models/notificationModel');

const BloodController = {
  searchAvailability: async (req, res, next) => {
    try {
      const { bloodGroup, city, component } = req.query;

      let query = `
        SELECT bi.id, bi.blood_group AS bloodGroup, bi.component, bi.units, bi.expiry_date AS expiry, bi.status,
               p.name AS bankName, p.city, p.phone AS contact, bi.blood_bank_id AS id
        FROM blood_inventory bi
        JOIN users u ON bi.blood_bank_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE bi.status = 'available' AND bi.units > 0 AND u.status = 'verified'
      `;
      const params = [];

      if (bloodGroup) {
        query += ` AND bi.blood_group = ?`;
        params.push(bloodGroup);
      }
      if (city) {
        query += ` AND p.city = ?`;
        params.push(city);
      }
      if (component) {
        query += ` AND bi.component = ?`;
        params.push(component);
      }

      query += ` ORDER BY bi.units DESC`;

      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  getInventory: async (req, res, next) => {
    try {
      const bankId = req.user.id;
      const [rows] = await db.execute(
        'SELECT * FROM blood_inventory WHERE blood_bank_id = ? ORDER BY expiry_date ASC',
        [bankId]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  addInventory: async (req, res, next) => {
    try {
      const bankId = req.user.id;
      const { bloodGroup, component, units, collected, expiry } = req.body;

      if (!bloodGroup || !component || !units) {
        return res.status(400).json({ message: 'Blood group, component, and units count are required' });
      }

      await db.execute(
        `INSERT INTO blood_inventory (blood_bank_id, blood_group, component, units, collected_date, expiry_date, status)
         VALUES (?, ?, ?, ?, ?, ?, 'available')`,
        [bankId, bloodGroup, component, Number(units), collected || null, expiry || null]
      );

      await LogModel.create(bankId, 'ADD_INVENTORY', `Added ${units} units of ${bloodGroup} (${component})`);

      res.status(201).json({ message: 'Inventory updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  updateInventory: async (req, res, next) => {
    try {
      const bankId = req.user.id;
      const { id } = req.params;
      const { units, expiry, status } = req.body;

      if (units === undefined && expiry === undefined && status === undefined) {
        return res.status(400).json({ message: 'Nothing to update' });
      }

      const updates = [];
      const params = [];

      if (units !== undefined) {
        updates.push('units = ?');
        params.push(Number(units));
      }
      if (expiry !== undefined) {
        updates.push('expiry_date = ?');
        params.push(expiry || null);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      params.push(id, bankId);

      const [result] = await db.execute(
        `UPDATE blood_inventory SET ${updates.join(', ')} WHERE id = ? AND blood_bank_id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }

      res.json({ message: 'Inventory updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  deleteInventory: async (req, res, next) => {
    try {
      const bankId = req.user.id;
      const { id } = req.params;

      const [result] = await db.execute(
        'DELETE FROM blood_inventory WHERE id = ? AND blood_bank_id = ?',
        [id, bankId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }

      res.json({ message: 'Inventory item deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  createRequest: async (req, res, next) => {
    try {
      const requesterId = req.user.id;
      const { bloodBankId, bloodGroup, component, units, reason, notes, urgencyLevel } = req.body;

      if (!bloodBankId || !bloodGroup || !component || !units) {
        return res.status(400).json({ message: 'Blood bank, group, component, and units are required' });
      }

      await db.execute(
        `INSERT INTO blood_requests (requester_id, blood_bank_id, blood_group, component, units, reason, notes, urgency_level, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [requesterId, Number(bloodBankId), bloodGroup, component, Number(units), reason || '', notes || '', urgencyLevel || 'normal']
      );

      await LogModel.create(requesterId, 'BLOOD_REQUEST_CREATED', `Requested ${units} units of ${bloodGroup} from bank ID: ${bloodBankId}`);

      res.status(201).json({ message: 'Blood request submitted successfully' });
    } catch (err) {
      next(err);
    }
  },

  getRequests: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      if (role === 'bloodbank') {
        const [rows] = await db.execute(
          `SELECT br.*, p.name AS requesterName, p.phone AS contact
           FROM blood_requests br
           JOIN profiles p ON br.requester_id = p.user_id
           WHERE br.blood_bank_id = ?
           ORDER BY br.created_at DESC`,
          [userId]
        );
        res.json(rows);
      } else if (role === 'hospital') {
        const [rows] = await db.execute(
          `SELECT br.*, p.name AS bankName, p.city, p.phone AS contact
           FROM blood_requests br
           JOIN profiles p ON br.blood_bank_id = p.user_id
           WHERE br.requester_id = ?
           ORDER BY br.created_at DESC`,
          [userId]
        );
        res.json(rows);
      } else {
        const [rows] = await db.execute(
          `SELECT br.*, p1.name AS requesterName, p2.name AS bankName
           FROM blood_requests br
           JOIN profiles p1 ON br.requester_id = p1.user_id
           JOIN profiles p2 ON br.blood_bank_id = p2.user_id
           ORDER BY br.created_at DESC`
        );
        res.json(rows);
      }
    } catch (err) {
      next(err);
    }
  },

  updateRequestStatus: async (req, res, next) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const bankId = req.user.id;
      const { id } = req.params;
      const { status } = req.body; // 'accepted', 'rejected', 'fulfilled'

      if (!['accepted', 'rejected', 'fulfilled'].includes(status)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Check request details
      const [reqRows] = await conn.execute(
        'SELECT * FROM blood_requests WHERE id = ? AND blood_bank_id = ?',
        [id, bankId]
      );

      if (reqRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Request not found' });
      }

      const request = reqRows[0];

      // Inventory deduction check - only if moving from pending/rejected to accepted or fulfilled
      const needsDeduction = (status === 'accepted' && request.status === 'pending') || 
                             (status === 'fulfilled' && request.status === 'pending');

      if (needsDeduction) {
        // Find available matching units in bank inventory
        const [invRows] = await conn.execute(
          `SELECT * FROM blood_inventory 
           WHERE blood_bank_id = ? AND blood_group = ? AND component = ? AND status = 'available'
           ORDER BY expiry_date ASC`,
          [bankId, request.blood_group, request.component]
        );

        const totalAvailable = invRows.reduce((sum, item) => sum + item.units, 0);

        if (totalAvailable < request.units) {
          await conn.rollback();
          return res.status(400).json({ message: 'Insufficient units in blood bank inventory' });
        }

        // Subtract from inventory
        let unitsToDeduct = request.units;
        for (const item of invRows) {
          if (unitsToDeduct <= 0) break;
          if (item.units >= unitsToDeduct) {
            await conn.execute(
              'UPDATE blood_inventory SET units = units - ? WHERE id = ?',
              [unitsToDeduct, item.id]
            );
            unitsToDeduct = 0;
          } else {
            await conn.execute(
              'UPDATE blood_inventory SET units = 0, status = "unavailable" WHERE id = ?',
              [item.id]
            );
            unitsToDeduct -= item.units;
          }
        }
      }

      // Update request status
      await conn.execute(
        'UPDATE blood_requests SET status = ? WHERE id = ?',
        [status, id]
      );

      // Create log
      await LogModel.create(bankId, 'BLOOD_REQUEST_RESOLVED', `Blood request ID ${id} was ${status}`);

      // Create DB notification for hospital
      await NotificationModel.create(request.requester_id, bankId, `request_${status}`, id);

      await conn.commit();

      // Socket.IO Emit notification to hospital
      const io = req.app.get('socketio');
      if (io) {
        io.to(`user-${request.requester_id}`).emit('notification_update', {
          type: `request_${status}`,
          requestId: id
        });
      }

      res.json({ message: `Request successfully updated to ${status}` });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  },

  createEmergencyRequest: async (req, res, next) => {
    try {
      const hospitalId = req.user.id;
      const { patientName, bloodGroup, units, hospitalName, contact, emergencyLevel, additionalNotes } = req.body;

      if (!patientName || !bloodGroup || !units || !hospitalName || !contact) {
        return res.status(400).json({ message: 'Patient name, blood group, units count, hospital name, and contact phone are required' });
      }

      const [result] = await db.execute(
        `INSERT INTO emergency_requests (hospital_id, patient_name, blood_group, units, hospital_name, contact, emergency_level, additional_notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [hospitalId, patientName, bloodGroup, Number(units), hospitalName, contact, emergencyLevel || 'high', additionalNotes || '']
      );
      const requestId = result.insertId;

      await LogModel.create(hospitalId, 'EMERGENCY_REQUEST_BROADCAST', `Hospital ID ${hospitalId} broadcasted O- emergency request`);

      // Socket.IO Notify matching donors
      const io = req.app.get('socketio');
      if (io) {
        // Fetch donors with matching blood group and same city
        const [[hospProfile]] = await db.execute('SELECT city FROM profiles WHERE user_id = ?', [hospitalId]);
        if (hospProfile) {
          const [matchingDonors] = await db.execute(
            `SELECT user_id FROM profiles p
             JOIN users u ON p.user_id = u.id
             WHERE p.blood_group = ? AND p.city = ? AND u.role = 'donor' AND p.is_available = TRUE`,
            [bloodGroup, hospProfile.city]
          );

          const notifications = matchingDonors.map(donor => ({
            userId: donor.user_id,
            senderId: hospitalId,
            type: 'emergency_match',
            entityId: requestId
          }));

          if (notifications.length > 0) {
            await NotificationModel.createMany(notifications);
          }

          for (const donor of matchingDonors) {
            io.to(`user-${donor.user_id}`).emit('emergency_alert', {
              bloodGroup,
              hospitalName,
              requestId
            });
          }
        }
      }

      res.status(201).json({ message: 'Emergency request broadcasted successfully', id: requestId });
    } catch (err) {
      next(err);
    }
  },

  getEmergencyRequests: async (req, res, next) => {
    try {
      let query = 'SELECT * FROM emergency_requests';
      const params = [];
      if (req.query.hospitalId) {
        query += ' WHERE hospital_id = ?';
        params.push(req.query.hospitalId);
      }
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  getMatchingRequests: async (req, res, next) => {
    try {
      const donorId = req.user.id;
      const [[donor]] = await db.execute(
        'SELECT blood_group, city FROM profiles WHERE user_id = ?',
        [donorId]
      );

      if (!donor || !donor.blood_group || !donor.city) {
        return res.json([]);
      }

      const [rows] = await db.execute(
        `SELECT er.*, p.city, p.address
         FROM emergency_requests er
         JOIN profiles p ON er.hospital_id = p.user_id
         WHERE er.blood_group = ? AND p.city = ? AND er.status = 'pending'
         ORDER BY er.created_at DESC`,
        [donor.blood_group, donor.city]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  getDonationHistory: async (req, res, next) => {
    try {
      const donorId = req.user.id;
      const [rows] = await db.execute(
        'SELECT * FROM donation_history WHERE donor_id = ? ORDER BY donation_date DESC',
        [donorId]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  createDonationHistory: async (req, res, next) => {
    try {
      const donorId = req.user.id;
      const { bankName, donationDate, units, notes } = req.body;

      if (!bankName || !donationDate) {
        return res.status(400).json({ message: 'Bank name and donation date are required' });
      }

      await db.execute(
        'INSERT INTO donation_history (donor_id, blood_bank_name, donation_date, units, notes) VALUES (?, ?, ?, ?, ?)',
        [donorId, bankName, donationDate, Number(units) || 1, notes || '']
      );

      res.status(201).json({ message: 'Donation history recorded successfully' });
    } catch (err) {
      next(err);
    }
  },

  updateDonorAvailability: async (req, res, next) => {
    try {
      const donorId = req.user.id;
      const { isAvailable } = req.body;

      if (isAvailable === undefined) {
        return res.status(400).json({ message: 'isAvailable is required' });
      }

      await db.execute(
        'UPDATE profiles SET is_available = ? WHERE user_id = ?',
        [isAvailable ? 1 : 0, donorId]
      );

      res.json({ message: 'Availability updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  createAppointment: async (req, res, next) => {
    try {
      const donorId = req.user.id;
      const { bloodBankId, appointmentDate, timeSlot } = req.body;

      if (!bloodBankId || !appointmentDate || !timeSlot) {
        return res.status(400).json({ message: 'Blood bank, appointment date, and time slot are required' });
      }

      const [result] = await db.execute(
        `INSERT INTO donation_appointments (donor_id, blood_bank_id, appointment_date, time_slot, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [donorId, Number(bloodBankId), appointmentDate, timeSlot]
      );
      const apptId = result.insertId;

      await LogModel.create(donorId, 'DONATION_APPOINTMENT_CREATED', `Scheduled donation appointment for ${appointmentDate} at bank ID: ${bloodBankId}`);

      // Notify blood bank in DB
      await NotificationModel.create(Number(bloodBankId), donorId, 'new_appointment', apptId);

      // Emit socket notification to blood bank
      const io = req.app.get('socketio');
      if (io) {
        io.to(`user-${bloodBankId}`).emit('notification_update', {
          type: 'new_appointment',
          appointmentId: apptId
        });
      }

      res.status(201).json({ message: 'Donation appointment scheduled successfully' });
    } catch (err) {
      next(err);
    }
  },

  getAppointments: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      if (role === 'bloodbank') {
        const [rows] = await db.execute(
          `SELECT da.*, p.name AS donorName, p.phone AS contact, p.blood_group
           FROM donation_appointments da
           JOIN profiles p ON da.donor_id = p.user_id
           WHERE da.blood_bank_id = ?
           ORDER BY da.appointment_date ASC`,
          [userId]
        );
        res.json(rows);
      } else if (role === 'donor') {
        const [rows] = await db.execute(
          `SELECT da.*, p.name AS bankName, p.city, p.phone AS contact
           FROM donation_appointments da
           JOIN profiles p ON da.blood_bank_id = p.user_id
           WHERE da.donor_id = ?
           ORDER BY da.appointment_date ASC`,
          [userId]
        );
        res.json(rows);
      } else {
        const [rows] = await db.execute(
          `SELECT da.*, p1.name AS donorName, p2.name AS bankName
           FROM donation_appointments da
           JOIN profiles p1 ON da.donor_id = p1.user_id
           JOIN profiles p2 ON da.blood_bank_id = p2.user_id
           ORDER BY da.appointment_date ASC`
        );
        res.json(rows);
      }
    } catch (err) {
      next(err);
    }
  },

  updateAppointmentStatus: async (req, res, next) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const bankId = req.user.id;
      const { id } = req.params;
      const { status } = req.body; // 'accepted', 'rejected', 'completed', 'cancelled'

      if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const [apptRows] = await conn.execute(
        'SELECT * FROM donation_appointments WHERE id = ? AND blood_bank_id = ?',
        [id, bankId]
      );

      if (apptRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const appointment = apptRows[0];

      await conn.execute(
        'UPDATE donation_appointments SET status = ? WHERE id = ?',
        [status, id]
      );

      // If completed, update last_donation_date in profiles, and create a log entry in donation_history
      if (status === 'completed') {
        await conn.execute(
          'UPDATE profiles SET last_donation_date = ? WHERE user_id = ?',
          [appointment.appointment_date, appointment.donor_id]
        );

        // Fetch blood bank name for history
        const [[bankProfile]] = await conn.execute(
          'SELECT name FROM profiles WHERE user_id = ?',
          [bankId]
        );
        const bankName = bankProfile ? bankProfile.name : 'Blood Bank';

        await conn.execute(
          'INSERT INTO donation_history (donor_id, blood_bank_name, donation_date, units, notes) VALUES (?, ?, ?, 1, ?)',
          [appointment.donor_id, bankName, appointment.appointment_date, 'System logged donation appointment completion.']
        );
      }

      await conn.execute(
        'UPDATE donation_appointments SET status = ? WHERE id = ?',
        [status, id]
      );

      await conn.commit();
      res.json({ message: `Appointment status successfully updated to ${status}` });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  },

  getDonors: async (req, res, next) => {
    try {
      const [rows] = await db.execute(
        `SELECT u.id, u.email, p.name, p.phone, p.age, p.gender, p.city, p.state, p.blood_group, p.last_donation_date
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         WHERE u.role = 'donor'
         ORDER BY p.name ASC`
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  getBloodbanks: async (req, res, next) => {
    try {
      const [rows] = await db.execute(
        `SELECT u.id, p.name, p.city, p.phone, p.address, p.state
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         WHERE u.role = 'bloodbank' AND u.status = 'verified'
         ORDER BY p.name ASC`
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = BloodController;
