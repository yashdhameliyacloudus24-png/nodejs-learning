const express = require("express");
const Product = require("../models/product.model.js");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller.js");
const auth = require("../middleware/auth.js");

router.get("/", getProducts);
router.get("/:id", getProduct);

router.post("/", auth, createProduct);

// update a product
router.put("/:id", auth, updateProduct);

// delete a product
router.delete("/:id", auth, deleteProduct);

module.exports = router;
