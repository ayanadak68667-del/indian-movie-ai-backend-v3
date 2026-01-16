const MovieModel = require("../models/Movie");

class MongoCacheService {
  async get(tmdbId) {
    try {
      return await MovieModel.findOne({ tmdbId }).lean();
    } catch (error) {
      console.error("Cache Get Error:", error.message);
      return null;
    }
  }

  async set(data) {
    try {
      await MovieModel.findOneAndUpdate(
        { tmdbId: data.tmdbId },
        data,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Cache Set Error:", error.message);
    }
  }
}

module.exports = new MongoCacheService();
