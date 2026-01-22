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

  // ✅ ১. নতুন ডিসকভার ফাংশন (মুড ও বছর ফিল্টারের জন্য বাধ্যতামূলক)
  async discoverMovies({ genre, year }) {
    return await this.safeGet(`${TMDB_BASE}/discover/movie`, {
      with_genres: genre || "",
      primary_release_year: year || "2026",
      sort_by: "popularity.desc",
      language: "en-IN",
      region: "IN"
    });
  }

  // ✅ ২. নতুন রিলিজ ডেট ফাংশন (U/A সার্টিফিকেশন দেখানোর জন্য)
  async getReleaseDates(movieId) {
    return await this.safeGet(`${TMDB_BASE}/movie/${movieId}/release_dates`);
  }

  // ✅ বাকি সব আগের মতোই থাকছে (যাতে অন্য কিছু না ভাঙে)
  async searchMulti(query) {
    const [movies, tv] = await Promise.all([
      this.safeGet(`${TMDB_BASE}/search/movie`, { query, language: "en-IN", region: "IN" }),
      this.safeGet(`${TMDB_BASE}/search/tv`, { query, language: "en-IN" })
    ]);
    const movieResults = (movies?.results || []).map((m) => ({ ...m, media_type: "movie" }));
    const tvResults = (tv?.results || []).map((t) => ({ ...t, media_type: "tv" }));
    return [...movieResults, ...tvResults].slice(0, 20);
  }

  async getTrending() { // ব্যাকএন্ড রাউটের সাথে মিল রাখতে নাম পরিবর্তন
    return await this.safeGet(`${TMDB_BASE}/discover/movie`, {
      region: "IN",
      with_origin_country: "IN",
      sort_by: "popularity.desc",
      language: "en-IN"
    });
  }

  async getUpcoming() {
    return await this.safeGet(`${TMDB_BASE}/movie/upcoming`, { region: "IN", language: "en-IN" });
  }

  async getTopRated() {
    return await this.safeGet(`${TMDB_BASE}/movie/top_rated`, { region: "IN", language: "en-IN" });
  }

  async getPopularWebSeries() {
    return await this.safeGet(`${TMDB_BASE}/tv/popular`, { language: "en-IN" });
  }

  async getMovieDetails(movieId) {
    return await this.safeGet(`${TMDB_BASE}/movie/${movieId}`, {
      language: "en-IN",
      append_to_response: "credits,videos"
    });
  }

  async getWatchProviders(movieId) {
    const data = await this.safeGet(`${TMDB_BASE}/movie/${movieId}/watch/providers`);
    return data?.results?.IN || {};
  }
}

module.exports = new TMDBService();
