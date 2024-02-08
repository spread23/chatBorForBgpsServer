const express = require('express');

const router = express.Router();

const resultsController = require('../socketServer');

router.post("/get-results", resultsController.getResults);

module.exports = router;
