const db = require('../config/db');

async function run() {
  console.log('Running database migrations...');
  try {
    // 1. Add blood_type to users table (if not exists)
    const [columnsUsers] = await db.execute("SHOW COLUMNS FROM users LIKE 'blood_type'");
    if (columnsUsers.length === 0) {
      console.log("Adding 'blood_type' column to 'users' table...");
      await db.execute('ALTER TABLE users ADD COLUMN blood_type VARCHAR(5) NULL AFTER status');
    }

    // 2. Add type to messages table (if not exists)
    const [columnsMessages] = await db.execute("SHOW COLUMNS FROM messages LIKE 'type'");
    if (columnsMessages.length === 0) {
      console.log("Adding 'type' column to 'messages' table...");
      await db.execute("ALTER TABLE messages ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'text' AFTER image_url");
    }

    // 3. Drop and recreate emergency_requests table
    console.log("Re-creating 'emergency_requests' table...");
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DROP TABLE IF EXISTS emergency_requests');
    await db.execute(`
      CREATE TABLE emergency_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          hospital_id INT NOT NULL,
          blood_type_needed VARCHAR(5) NOT NULL,
          patient_info VARCHAR(255) NULL,
          status ENUM('active', 'fulfilled') NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fulfilled_at TIMESTAMP NULL,
          FOREIGN KEY (hospital_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_emg_blood_type (blood_type_needed),
          INDEX idx_emg_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Database migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error running migrations:', err.message);
    process.exit(1);
  }
}

run();
