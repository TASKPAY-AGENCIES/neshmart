const express = require('express');
const {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  listCategories, mySellerListings,
} = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/mine', requireAuth, mySellerListings);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);

module.exports = router;
