const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize('customer'), bookingController.create);
router.get('/my', authenticate, authorize('customer'), bookingController.getMyBookings);
router.get('/stats', authenticate, authorize('admin'), bookingController.getStats);
router.get('/', authenticate, authorize('admin'), bookingController.getAll);
router.get('/:id', authenticate, bookingController.getById);
router.patch('/:id/status', authenticate, authorize('admin'), bookingController.updateStatus);
router.patch('/:id/cancel', authenticate, authorize('customer'), bookingController.cancel);

module.exports = router;
