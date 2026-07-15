const express = require('express');
const router = express.Router();
const EmergencyController = require('../controllers/emergencyController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Get hospital's own requests (must register this before dynamic /:id to avoid collision)
router.get('/own', EmergencyController.getOwn);

// Create request (restricted to hospital in controller)
router.post('/', EmergencyController.create);

// Fulfill request (restricted to hospital in controller)
router.patch('/:id/fulfill', EmergencyController.fulfill);

module.exports = router;
