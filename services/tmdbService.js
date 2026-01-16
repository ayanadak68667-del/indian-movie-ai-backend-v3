const axios = require("axios");

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

class TMDBService {
  async safeGet(url, params = {}) {
    try {
      const res = await axios.get(url, {
        params: { api_key: API_KEY, ...params },
        timeout: 10000
      });
      return res.data;
    } catch (e) {
      console.error("TMDB ERROR:", url, e?.response?.status, e?.message);
      return null;
    }
  }

  // ✅ Search movies + tv
  async searchMulti(query) {
    const [movies, tv] = await Promise.all([
      this.safeGet(`${TMDB_BASE}/search/movie`, {
        query,
        language: "en-IN",
        region: "IN"
      }),
      this.safeGet(`${TMDB_BASE}/search/tv`, {
        query,
        language: "en-IN"
      })
    ]);

    const movieResults = movies?.results || [];
    const tvResults = tv?.results || [];

    // add media_type for frontend
    const combined = [
      ...movieResults.map((m) => ({ ...m, media_type: "movie" })),
      ...tvResults.map((t) => ({ ...t, media_type: "tv" }))
    ];

    return combined.slice(0, 20);
  }

  // ✅ Trending India (Discover-based)
  async getTrendingIndia() {
    const data = await this.safeGet(`${TMDB_BASE}/discover/movie`, {
      region: "IN",
      with_origin_country: "IN",
      sort_by: "popularity.desc"
    });
    return data?.results?.slice(0, 10) || [];
  }

  async getUpcomingIndia() {
    const data = await this.safeGet(`${TMDB_BASE}/movie/upcoming`, {
      region: "IN",
      language: "en-IN"
    });
    return data?.results?.slice(0, 10) || [];
  }

  async getTopRatedIndia() {
    const data = await this.safeGet(`${TMDB_BASE}/movie/top_rated`, {
      region: "IN",
      language: "en-IN"
    });
    return data?.results?.slice(0, 10) || [];
  }

  async getPopularWebSeriesIndia() {
    const data = await this.safeGet(`${TMDB_BASE}/tv/popular`, {
      language: "en-IN"
    });
    return data?.results?.slice(0, 10) || [];
  }

  // ✅ Movie details + credits for AI blog
  async getMovieDetails(movieId) {
    const data = await this.safeGet(`${TMDB_BASE}/movie/${movieId}`, {
      language: "en-IN",
      append_to_response: "credits"
    });
    return data || null;
  }

  // ✅ Watch Providers
  async getWatchProviders(movieId) {
    const data = await this.safeGet(`${TMDB_BASE}/movie/${movieId}/watch/providers`, {});
    return data?.results?.IN || {};
  }
}

module.exports = new TMDBService();
