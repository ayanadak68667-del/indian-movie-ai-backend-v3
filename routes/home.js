const express = require("express");
const router = express.Router();
const tmdbService = require("../services/tmdbService");

// GET /api/trending
router.get("/trending", async (req, res) => {
  try {
    const data = await tmdbService.getTrendingIndia();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

// GET /api/upcoming
router.get("/upcoming", async (req, res) => {
  try {
    const data = await tmdbService.getUpcomingIndia();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

// GET /api/top-rated
router.get("/top-rated", async (req, res) => {
  try {
    const data = await tmdbService.getTopRatedIndia();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

// GET /api/web-series
router.get("/web-series", async (req, res) => {
  try {
    const data = await tmdbService.getPopularWebSeriesIndia();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, data: [] });
  }
});

module.exports = router;
