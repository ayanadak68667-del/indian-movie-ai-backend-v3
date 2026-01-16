const axios = require("axios");

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

class YouTubeService {
  async getTrailer(movieTitle) {
    try {
      if (!movieTitle) return null;

      const query = `${movieTitle} official trailer`;

      const response = await axios.get(`${YOUTUBE_BASE}/search`, {
        params: {
          part: "snippet",
          q: query,
          type: "video",
          videoEmbeddable: "true",
          maxResults: 1,
          key: API_KEY
        },
        timeout: 10000
      });

      const item = response.data?.items?.[0];
      if (!item?.id?.videoId) return null;

      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          "",
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
      };
    } catch (error) {
      console.error("Trailer fetch error:", error.message);
      return null;
    }
  }

  async getPlaylist(movieTitle) {
    try {
      if (!movieTitle) return null;

      // ✅ Try playlist first
      const playlistQuery = `${movieTitle} songs jukebox playlist`;
      const playlistRes = await axios.get(`${YOUTUBE_BASE}/search`, {
        params: {
          part: "snippet",
          q: playlistQuery,
          type: "playlist",
          maxResults: 1,
          key: API_KEY
        },
        timeout: 10000
      });

      const playlistItem = playlistRes.data?.items?.[0];
      if (playlistItem?.id?.playlistId) {
        return {
          id: playlistItem.id.playlistId,
          title: playlistItem.snippet.title,
          thumbnail:
            playlistItem.snippet.thumbnails?.high?.url ||
            playlistItem.snippet.thumbnails?.medium?.url ||
            "",
          embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistItem.id.playlistId}`
        };
      }

      // ✅ Fallback to video jukebox
      const videoQuery = `${movieTitle} songs jukebox`;
      const videoRes = await axios.get(`${YOUTUBE_BASE}/search`, {
        params: {
          part: "snippet",
          q: videoQuery,
          type: "video",
          videoEmbeddable: "true",
          maxResults: 1,
          key: API_KEY
        },
        timeout: 10000
      });

      const videoItem = videoRes.data?.items?.[0];
      if (!videoItem?.id?.videoId) return null;

      return {
        id: videoItem.id.videoId,
        title: videoItem.snippet.title,
        thumbnail:
          videoItem.snippet.thumbnails?.high?.url ||
          videoItem.snippet.thumbnails?.medium?.url ||
          "",
        embedUrl: `https://www.youtube.com/embed/${videoItem.id.videoId}`
      };
    } catch (error) {
      console.error("Playlist fetch error:", error.message);
      return null;
    }
  }
}

module.exports = new YouTubeService();
