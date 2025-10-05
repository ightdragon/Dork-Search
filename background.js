console.log("[BG] Loaded");

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  console.log("[BG] Message received:", msg);
  if (msg.type === "REWRITE") {
    rewrite(msg.query).then((r) => {
      console.log("[BG] Sending response:", r);
      send({ rewritten: r });
    });
    return true;
  }
});




const GEMINI_API_KEY = "<Your API KEY>"; // Replace with your actual key
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

async function rewrite(userQuery) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const prompt = `
You are a query builder for Google Search.  
  Your task is to rewrite user requests into clean, optimized Google search queries.  
  
  Rules:
  - Only output the query string (no explanations).  
  - Use quotes around key phrases.
  - Remove filler words like "show me", "I want to know", etc.
  - Keep important keywords, entities, and topics.
  - Break down complex queries into key components.
  - Each component in quotes should have max 3 words.
  - If the query is concatenated by mistake, split into separate words/phrases.
  - Identify adjectives and nouns to form concise phrases.
  - Fact check the phrase for accuracy before using them, correct if needed.
  - Expand acronyms on first use, e.g. "NASA" → "National Aeronautics and Space Administration (NASA)"
  Location:
  - If a location is mentioned (city, country, region), include it in the query.
  - If no location is mentioned, do not add any location terms.
  - For ambiguous locations (e.g., "Springfield"), do not guess or add state/country.
  Time:
  - If a time expression is mentioned (e.g., "last 24 hours", "past week", "since 2020"), convert it into absolute date filters using Google's syntax.
  - Use \`after:YYYY-MM-DD\` for open-ended ranges (last 24 hours, last week, past month, since 2020).
  - Only use \`before:YYYY-MM-DD\` if the user explicitly sets an upper bound (e.g., "between", "until", "before").
  - Never add \`before:\` equal to today's date, because it excludes today.

  FileType:
  If the user mentions a document type (PDF, PPT, Word, Excel, report, presentation, slides, data table, etc.), add the correct Google operator:
  - report, research paper, whitepaper → filetype:pdf  
  - presentation, slides, deck → filetype:ppt OR filetype:pptx  
  - word doc, draft, document → filetype:doc OR filetype:docx  
  - spreadsheet, table, data sheet → filetype:xls OR filetype:xlsx  
  If no file type is mentioned, do not add a filetype filter.

  Social bias:
  - If the request is about discussions, opinions, or social platforms, keep words like "Twitter", "Reddit", "YouTube" in the query (do not remove them).  
  - If the request is about official information, research, or factual data, remove social media platform names to prioritize authoritative sources.
  - If government data or official sources are mentioned, add site:gov OR site:edu to the query.
  - Do not add explanations, extra words, or formatting — only return the query.
  - Follow this template: "<keywords/phrases>" <location terms> <social terms> filetype:<> after:<>/before:<> site:<>

  User request: "${userQuery}"
  Today's date: ${today}
`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
      topP: 0.8
    }
      })
    });

    const data = await res.json();
    console.log("[BG] Full Gemini response:", data);

    const refined = data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?.trim()
      .replace(/\s+/g, " ");

    console.log("[BG] Refined query:", refined);
    return refined || userQuery;
  } catch (err) {
    console.error("[BG] Rewrite exception:", err);
    return userQuery;
  }
}



