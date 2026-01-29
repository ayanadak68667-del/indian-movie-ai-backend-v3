const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie'); // আপনার MongoDB মডেল
const Trending = require('../models/Trending'); // ট্রেন্ডিং সেভ করার জন্য মডেল
const axios = require('axios');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ১. ট্রেন্ডিং ইন্ডিয়ান মুভি (২৪ ঘণ্টা রিফ্রেশ লজিক)
router.get('/trending', async (req, res) => {
  try {
    // ডাটাবেসে চেক করা আজকের ট্রেন্ডিং আছে কি না
    let trendingData = await Trending.findOne({ type: 'trending_indian' });
    
    const oneDay = 24 * 60 * 60 * 1000;
    const isOld = trendingData && (Date.now() - trendingData.updatedAt > oneDay);

    if (!trendingData || isOld) {
      // যদি ডাটা না থাকে বা পুরনো হয়ে যায়, তবে TMDB থেকে আনা
      const response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
        params: { 
          api_key: process.env.TMDB_API_KEY, 
          with_origin_country: 'IN',
          sort_by: 'popularity.desc' 
        }
      });
      
      // MongoDB আপডেট করা
      trendingData = await Trending.findOneAndUpdate(
        { type: 'trending_indian' },
        { data: response.data.results, updatedAt: Date.now() },
        { upsert: true, new: true }
      );
    }
    
    res.json({ success: true, data: trendingData.data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Trending Update Failed" });
  }
});

// ২. মুভি ডিটেইলস (MongoDB-তে সেভ রাখার লজিক)
router.get('/:id', async (req, res) => {
  const movieId = req.params.id;
  try {
    // প্রথমে ডাটাবেসে খোঁজা (যাতে API Call বাঁচে)
    let movie = await Movie.findOne({ tmdbId: movieId });

    if (!movie) {
      // যদি ডাটাবেসে না থাকে, তবে Groq AI দিয়ে জেনারেট করে সেভ করা
      // [এখানে আগের মতো TMDB এবং Groq কল হবে...]
      
      // সেভ করার পর ইউজারকে পাঠানো
      // await Movie.create({ tmdbId: movieId, aiAnalysis: aiData, ... });
    }
    
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});
