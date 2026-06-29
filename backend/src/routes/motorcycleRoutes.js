const express = require('express');
const motorcycleController = require('../controllers/motorcycleController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/featured', motorcycleController.getFeatured);
router.get('/', motorcycleController.getAll);
router.get('/:id', motorcycleController.getById);

router.post('/', authenticate, authorize('admin'), upload.single('image'), motorcycleController.create);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), motorcycleController.update);
router.delete('/:id', authenticate, authorize('admin'), motorcycleController.remove);

module.exports = router;
