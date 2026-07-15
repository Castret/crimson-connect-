-- Crimson Connect Seed Data
-- Dedicated to Blood Donation & Blood Bank Management

USE crimson_connect;

-- Insert Initial Test Users
-- Passwords are hashed version of 'Password123!' (using bcrypt, standard cost factor)
-- Hash: $2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e
INSERT INTO users (id, email, password_hash, role, status) VALUES
(1, 'admin@crimson.com', '$2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e', 'admin', 'verified'),
(2, 'donor1@crimson.com', '$2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e', 'donor', 'verified'),
(3, 'donor2@crimson.com', '$2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e', 'donor', 'verified'),
(4, 'bank1@crimson.com', '$2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e', 'bloodbank', 'verified'),
(5, 'bank2@crimson.com', '$2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e', 'bloodbank', 'pending'),
(6, 'hosp1@crimson.com', '$2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e', 'hospital', 'verified'),
(7, 'hosp2@crimson.com', '$2a$10$MmBU94y.C9/nxs7YUnUCRe2NictAEQnF.p8ViyMoLNAwagudzmQ6e', 'hospital', 'pending');

-- Insert Profiles
INSERT INTO profiles (user_id, name, bio, phone, age, gender, address, city, state, blood_group, last_donation_date, license_number, is_available) VALUES
(1, 'System Administrator', 'Crimson Connect Blood Bank Portal Administrator', '+91 99999 88888', 35, 'Male', 'Admin Center, Sector 12', 'Delhi', 'Delhi', NULL, NULL, NULL, TRUE),
(2, 'Alex Mercer', 'Regular blood donor, O+ blood type. Passionate about helping others.', '+91 98765 43210', 25, 'Male', 'Flat 402, Sunshine Apts', 'Delhi', 'Delhi', 'O+', '2026-05-10', NULL, TRUE),
(3, 'Jane Doe', 'A- donor, happy to donate in emergency situations.', '+91 98000 11111', 22, 'Female', 'House 12B, Rose Gardens', 'Mumbai', 'Maharashtra', 'A-', '2026-04-15', NULL, FALSE),
(4, 'Apollo Blood Bank', 'Apollo Hospital Blood Center, Delhi Branch.', '+91 11-2658-8700', NULL, NULL, 'Apollo Hospital, Sarita Vihar', 'Delhi', 'Delhi', NULL, NULL, 'LIC-APO-9876', TRUE),
(5, 'Red Cross Society Mumbai', 'Indian Red Cross Society, Mumbai District.', '+91 22-2266-1524', NULL, NULL, 'Red Cross Bldg, Fort', 'Mumbai', 'Maharashtra', NULL, NULL, 'LIC-RCS-1234', TRUE),
(6, 'City General Hospital', 'City General Hospital central clinic and emergency room.', '+91 11-2659-1111', NULL, NULL, 'Sector 5, Green Park', 'Delhi', 'Delhi', NULL, NULL, 'LIC-CGH-1111', TRUE),
(7, 'St. Jude Medical Center', 'St. Jude Medical Center branch clinic.', '+91 22-2266-2222', NULL, NULL, 'Bandra West, Link Road', 'Mumbai', 'Maharashtra', NULL, NULL, 'LIC-SJM-2222', TRUE);

-- Insert Blood Inventory
INSERT INTO blood_inventory (blood_bank_id, blood_group, component, units, collected_date, expiry_date, status) VALUES
(4, 'O+', 'Whole Blood', 14, '2026-07-01', '2026-08-12', 'available'),
(4, 'A-', 'Platelets', 5, '2026-07-10', '2026-07-15', 'available'),
(4, 'B+', 'Packed RBC', 8, '2026-06-25', '2026-08-06', 'available'),
(4, 'AB+', 'FFP', 3, '2026-07-01', '2027-07-01', 'available'),
(5, 'A-', 'Whole Blood', 10, '2026-07-02', '2026-08-13', 'available'),
(5, 'O-', 'Packed RBC', 4, '2026-07-05', '2026-08-16', 'available'),
(5, 'B-', 'Platelets', 0, '2026-06-10', '2026-06-15', 'expired');

-- Insert Hospital Blood Requests
INSERT INTO blood_requests (id, requester_id, blood_bank_id, blood_group, component, units, reason, notes, urgency_level, status, created_at) VALUES
(1, 6, 4, 'O+', 'Whole Blood', 2, 'Scheduled surgery support', 'Patient scheduled for open heart surgery.', 'high', 'pending', CURRENT_TIMESTAMP),
(2, 6, 4, 'A-', 'Platelets', 1, 'Thrombocytopenia patient', 'Emergency transfusion needed.', 'critical', 'accepted', CURRENT_TIMESTAMP - INTERVAL 1 DAY),
(3, 7, 5, 'B+', 'Packed RBC', 3, 'Accident victim emergency', 'Severe trauma patient.', 'critical', 'fulfilled', CURRENT_TIMESTAMP - INTERVAL 2 DAY);

-- Insert Emergency Requests (notice board)
INSERT INTO emergency_requests (id, hospital_id, patient_name, blood_group, units, hospital_name, contact, emergency_level, additional_notes, status, created_at) VALUES
(1, 6, 'Rajesh Kumar', 'O-', 3, 'Fortis Hospital, Shalimar Bagh', '+91 99111 22233', 'critical', 'Severe internal bleeding from road accident. Urgent requirement.', 'pending', CURRENT_TIMESTAMP),
(2, 6, 'Priya Patel', 'AB-', 1, 'Lilavati Hospital, Bandra', '+91 98222 33344', 'high', 'Planned cardiac surgery component backup.', 'pending', CURRENT_TIMESTAMP),
(3, 7, 'Vijay Sharma', 'A+', 2, 'Max Super Speciality, Saket', '+91 98111 55566', 'normal', 'Thalassemia patient regular transfusion.', 'completed', CURRENT_TIMESTAMP - INTERVAL 3 DAY);

-- Insert Donation Appointments
INSERT INTO donation_appointments (donor_id, blood_bank_id, appointment_date, time_slot, status, created_at) VALUES
(2, 4, '2026-07-20', '10:00 AM – 11:00 AM', 'pending', CURRENT_TIMESTAMP),
(3, 5, '2026-07-18', '02:00 PM – 03:00 PM', 'pending', CURRENT_TIMESTAMP);

-- Insert Donation History
INSERT INTO donation_history (donor_id, blood_bank_name, donation_date, units, notes) VALUES
(2, 'Apollo Blood Bank', '2026-02-14', 1, 'Regular O+ donation, felt great.'),
(3, 'Red Cross Society Mumbai', '2026-01-20', 1, 'Emergency platelet donation.');
