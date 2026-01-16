const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateMovieBlog = async (movie) => {
  try {
    const safeTitle = movie?.title || "Unknown";
    const safeOverview = movie?.overview || "N/A";
    const safeRelease = movie?.release_date || "N/A";
    const safeLang = movie?.original_language || "N/A";
    const safeRating = movie?.vote_average || "N/A";

    const castNames =
      movie?.credits?.cast?.slice(0, 5).map((c) => c.name).join(", ") || "N/A";

    const prompt = `
Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:

{
  "synopsis": "Brief story summary (3-4 lines)",
  "performance": "Actors, direction, music analysis",
  "pros": ["point1", "point2", "point3"],
  "cons": ["point1", "point2"],
  "verdict": "Final critical opinion",
  "audience": "Who should watch this movie"
}

Movie:
Title: ${safeTitle}
Overview: ${safeOverview}
Release date: ${safeRelease}
Language: ${safeLang}
Rating: ${safeRating}
Cast: ${castNames}
`;

    const completion = await Promise.race([
      groq.chat.completions.create({
        model: "llama3-70b-8192",
        temperature: 0.6,
        max_tokens: 900,
        messages: [
          { role: "system", content: "You are an expert Indian movie critic and SEO blogger." },
          { role: "user", content: prompt }
        ]
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Groq timeout")), 15000)
      )
    ]);

    const raw = completion.choices[0]?.message?.content || "";

    // ✅ Extract JSON safely
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");

    if (first === -1 || last === -1) return {};

    const jsonText = raw.slice(first, last + 1);

    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error("Groq JSON Parse Failed");
      return {};
    }
  } catch (error) {
    console.error("Groq AI Error:", error.message);
    return {};
  }
};

module.exports = { generateMovieBlog };
