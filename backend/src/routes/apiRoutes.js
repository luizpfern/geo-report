const express = require('express');
const { createReport, listReports } = require('../controllers/reportController');
const { listReportTypes } = require('../controllers/typeController');

const router = express.Router();

router.post('/reports', createReport);
router.get('/reports', listReports);
router.get('/report-types', listReportTypes);

module.exports = router;
