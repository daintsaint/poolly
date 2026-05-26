/**
 * Derive a ServiceMark ID from a pool title.
 * Tries keyword matching first; falls back to category-based mapping.
 */

const TITLE_KEYWORDS: [RegExp, string][] = [
  [/netflix/i,                        "netflix"],
  [/spotify/i,                        "spotify"],
  [/disney/i,                         "disney"],
  [/hbo|max\b/i,                      "hbo"],
  [/icloud/i,                         "icloud"],
  [/notion/i,                         "notion"],
  [/microsoft|ms\s*365|office\s*365|m365/i, "ms365"],
  [/adobe/i,                          "adobe"],
  [/peloton/i,                        "peloton"],
  [/new york times|nyt\b/i,           "nyt"],
  [/chatgpt|openai/i,                 "chatgpt"],
  [/claude|anthropic/i,               "claude"],
  [/nordvpn|nord\s*vpn/i,             "nordvpn"],
];

// Fallback when no title keyword matches
const CAT_TO_SVC: Record<number, string> = {
  0: "netflix",   // Streaming
  1: "ms365",     // Productivity
  2: "peloton",   // Fitness
  3: "disney",    // Local Services
  4: "claude",    // Professional Tools
  5: "chatgpt",   // Other
};

export function titleToSvcId(title: string, category?: number): string {
  for (const [re, id] of TITLE_KEYWORDS) {
    if (re.test(title)) return id;
  }
  if (category !== undefined && CAT_TO_SVC[category]) {
    return CAT_TO_SVC[category];
  }
  return "chatgpt"; // final fallback
}
