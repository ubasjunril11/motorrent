const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/customers', adminController.getAllCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.patch('/customers/:id/toggle-status', adminController.toggleCustomerStatus);
router.delete('/customers/:id', adminController.deleteCustomer);
router.post('/admins', adminController.createAdmin);

module.exports = router;
