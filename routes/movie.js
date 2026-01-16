const express = require("express");
const router = express.Router();

const tmdbService = require("../services/tmdbService");
const youtubeService = require("../services/youtubeService");
const { generateMovieBlog } = require("../services/groqService");
const mongoCache = require("../services/mongoCacheService");

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

// GET /api/search?q=keyword
router.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const data = await tmdbService.searchMulti(query);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// GET /api/movie/:id
router.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    // ✅ 1) Mongo Cache Check
    const cachedMovie = await mongoCache.get(movieId);

    const isStale = cachedMovie?.lastUpdated
      ? Date.now() - new Date(cachedMovie.lastUpdated).getTime() > CACHE_TTL
      : true;

    if (cachedMovie && !isStale) {
      return res.json({
        success: true,
        data: {
          movie: cachedMovie.details || {},
          trailer: cachedMovie.trailer || null,
          playlist: cachedMovie.playlist || null,
          aiBlog: cachedMovie.aiBlog || {},
          watchProviders: cachedMovie.watchProviders || {},
          meta: cachedMovie.meta || {},
          lastUpdated: cachedMovie.lastUpdated,
          cached: true
        }
      });
    }

    // ✅ 2) TMDB Details
    const movie = await tmdbService.getMovieDetails(movieId);
    if (!movie) throw new Error("TMDB details failed");

    // ✅ 3) Parallel calls
    const [trailer, playlist, aiBlog, watchProviders] = await Promise.all([
      youtubeService.getTrailer(movie.title).catch(() => null),
      youtubeService.getPlaylist(movie.title).catch(() => null),
      generateMovieBlog(movie).catch(() => ({})),
      tmdbService.getWatchProviders(movieId).catch(() => ({}))
    ]);

    // ✅ 4) Meta flags
    const releaseTime = movie.release_date
      ? new Date(movie.release_date).getTime()
      : null;

    const meta = {
      isTrending: (movie.popularity || 0) > 100,
      isNew: releaseTime
        ? (Date.now() - releaseTime) / (1000 * 60 * 60 * 24) < 60
        : false,
      popularity: movie.popularity || 0,
      imdbRating: movie.vote_average || 0
    };

    // ✅ 5) Save to Mongo Cache
    const movieData = {
      tmdbId: String(movieId),
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      details: movie,
      trailer: trailer || null,
      playlist: playlist || null,
      aiBlog: aiBlog || {},
      watchProviders: watchProviders || {},
      meta,
      lastUpdated: new Date()
    };

    await mongoCache.set(movieData);

    // ✅ 6) Response
    return res.json({
      success: true,
      data: {
        movie: movieData.details,
        trailer: movieData.trailer,
        playlist: movieData.playlist,
        aiBlog: movieData.aiBlog,
        watchProviders: movieData.watchProviders,
        meta: movieData.meta,
        lastUpdated: movieData.lastUpdated,
        cached: false
      }
    });
  } catch (error) {
    console.error("Movie Route Error:", error.message);

    return res.status(500).json({
      success: false,
      data: {
        movie: {},
        trailer: null,
        playlist: null,
        aiBlog: {},
        watchProviders: {},
        meta: {},
        cached: false
      }
    });
  }
});

module.exports = router;
