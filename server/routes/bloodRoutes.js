const express = require('express');
const router = express.Router();
const BloodController = require('../controllers/bloodController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/availability', BloodController.searchAvailability);
router.get('/banks', BloodController.getBloodbanks);
router.get('/emergency', BloodController.getEmergencyRequests);

// Protected endpoints
router.use(authenticateToken);

// Emergency POST
router.post('/emergency', BloodController.createEmergencyRequest);

// Donor-specific
router.get('/matching-requests', BloodController.getMatchingRequests);
router.get('/donation-history', BloodController.getDonationHistory);
router.post('/donation-history', BloodController.createDonationHistory);
router.patch('/donor-availability', BloodController.updateDonorAvailability);

// Inventory
router.get('/inventory', BloodController.getInventory);
router.post('/inventory', BloodController.addInventory);
router.put('/inventory/:id', BloodController.updateInventory);
router.patch('/inventory/:id', BloodController.updateInventory);
router.delete('/inventory/:id', BloodController.deleteInventory);

// Requests
router.get('/requests', BloodController.getRequests);
router.post('/requests', BloodController.createRequest);
router.put('/requests/:id', BloodController.updateRequestStatus);
router.patch('/requests/:id', BloodController.updateRequestStatus);

// Appointments
router.get('/appointments', BloodController.getAppointments);
router.post('/appointments', BloodController.createAppointment);
router.put('/appointments/:id', BloodController.updateAppointmentStatus);
router.patch('/appointments/:id', BloodController.updateAppointmentStatus);

// Donors
router.get('/donors', BloodController.getDonors);

module.exports = router;
