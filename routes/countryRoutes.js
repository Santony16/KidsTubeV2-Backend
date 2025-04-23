const express = require("express");
const router = express.Router();
const { getCountries } = require("../controllers/countryController");

// Route to get all countries with their data
router.get("/", getCountries);

module.exports = router;
