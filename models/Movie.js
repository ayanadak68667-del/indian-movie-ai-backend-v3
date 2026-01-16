const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    title: String,
    poster_path: String,
    release_date: String,

    details: {
      type: Object,
      default: {}
    },

    trailer: {
      type: Object,
      default: null
    },

    // ✅ Single object (playlist or jukebox video)
    playlist: {
      type: Object,
      default: null
    },

    aiBlog: {
      type: Object,
      default: {}
    },

    watchProviders: {
      type: Object,
      default: {}
    },

    meta: {
      isTrending: { type: Boolean, default: false },
      isNew: { type: Boolean, default: false },
      popularity: { type: Number, default: 0 },
      imdbRating: { type: Number, default: 0 }
    },

    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", MovieSchema);
