const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const youtubeService = require("../services/youtubeService");
const { generateMovieBlog } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

// ✅ ১. GET /api/trending - হোমপেজের জন্য ট্রেন্ডিং মুভি
router.get("/trending", async (req, res) => {
  try {
    const data = await tmdbService.getTrending(); // নিশ্চিত করো tmdbService-এ এই ফাংশন আছে
    res.json({ success: true, data: data.results || [] });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ✅ ২. GET /api/discover - মুড (Genre) এবং বছর (Year) দিয়ে ফিল্টার
router.get("/discover", async (req, res) => {
  try {
    const { genre, year } = req.query;
    const data = await tmdbService.discoverMovies({ genre, year }); 
    // tmdbService.discoverMovies-এ axios.get('/discover/movie', { params: { with_genres: genre, primary_release_year: year } }) থাকতে হবে
    res.json({ success: true, data: data.results || [] });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ✅ ৩. GET /api/search?q=keyword
router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    if (!query || query.length < 2) return res.json({ success: true, data: [] });

    const data = await tmdbService.searchMulti(query);
    return res.json({ success: true, data: data.results || [] });
  } catch (error) {
    res.status(500).json({ success: false, data: [] });
  }
});

// ✅ ৪. GET /api/movie/:id (ডিটেইলস ও সার্টিফিকেশন ফিক্স)
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const cachedMovie = await mongoCache.get(movieId);
    const isStale = cachedMovie?.lastUpdated
      ? Date.now() - new Date(cachedMovie.lastUpdated).getTime() > CACHE_TTL
      : true;

    if (cachedMovie && !isStale) {
      return res.json({ success: true, data: { ...cachedMovie, cached: true } });
    }

    const movie = await tmdbService.getMovieDetails(movieId);
    if (!movie) throw new Error("TMDB details failed");

    // সার্টিফিকেশন ডেটা আনা (রিয়েল মেটাডেটা)
    const releaseDates = await tmdbService.getReleaseDates(movieId); // নতুন সার্ভিস কল
    const indiaRelease = releaseDates?.results?.find(r => r.iso_3166_1 === 'IN');
    const cert = indiaRelease ? indiaRelease.release_dates[0].certification : "UA 13+";

    const [trailer, playlist, aiBlog, watchProviders] = await Promise.all([
      youtubeService.getTrailer(movie.title).catch(() => null),
      youtubeService.getPlaylist(movie.title).catch(() => null),
      generateMovieBlog(movie).catch(() => ({})),
      tmdbService.getWatchProviders(movieId).catch(() => ({}))
    ]);

    const meta = {
      isTrending: (movie.popularity || 0) > 100,
      isNew: movie.release_date ? (Date.now() - new Date(movie.release_date)) / 86400000 < 60 : false,
      popularity: movie.popularity || 0,
      imdbRating: movie.vote_average || 0,
      certification: cert // রিয়েল সার্টিফিকেশন অ্যাড করা হলো
    };

    const movieData = {
      tmdbId: String(movieId),
      details: movie,
      trailer,
      playlist,
      aiBlog,
      watchProviders,
      meta,
      lastUpdated: new Date()
    };

    await mongoCache.set(movieData);

    return res.json({ success: true, data: { ...movieData, cached: false } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
