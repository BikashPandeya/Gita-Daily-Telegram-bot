import baseData from "../data/base.json";
import enData from "../data/en.json";
import hiData from "../data/hi.json";
import type { BaseVerse, TranslationVerse, VerseRecord } from "./types";

const base = baseData as Record<string, BaseVerse>;
const english = enData as Record<string, TranslationVerse>;
const hindi = hiData as Record<string, TranslationVerse>;

// A curated rotation of commonly studied, practical verses.
// Add or remove references here to change the daily sequence.
export const FEATURED_KEYS = [
  "2-14", "2-20", "2-22", "2-47", "2-48", "2-50", "2-56",
  "2-62", "2-63", "2-70", "3-19", "3-21", "3-30",
  "4-7", "4-8", "4-38", "5-10", "6-5", "6-6", "6-26",
  "6-35", "9-22", "9-26", "10-20", "12-13", "12-14",
  "12-15", "12-16", "12-17", "12-18", "12-19", "12-20",
  "14-26", "16-1", "18-46", "18-47", "18-63", "18-66"
].filter((key) => Boolean(base[key]));

// Short original reflections written for this bot, not quotations from a translation.
const reflections: Record<string, string> = {
  "2-14": "Comfort and discomfort both change with time. Meet temporary situations with patience and a balanced mind.",
  "2-20": "Look beyond temporary changes and remember the deeper values that give your life meaning.",
  "2-22": "Change is part of life. Let it teach you adaptability rather than fear.",
  "2-47": "Give your best effort. Do not let anxiety about the result stop you from doing what is right.",
  "2-48": "Try to stay steady in success and disappointment. A balanced mind helps you make better decisions.",
  "2-50": "Bring care and skill to your actions. Good work is not only about the outcome, but also how you do it.",
  "2-56": "Practice responding thoughtfully instead of allowing every difficulty to control your state of mind.",
  "2-62": "Notice how repeated attention can shape your desires. Choose carefully what receives your time and focus.",
  "2-63": "Pause before reacting. A calm moment can prevent a small frustration from becoming a bigger problem.",
  "2-70": "Contentment grows when you learn not to chase every passing want.",
  "3-19": "Do the work that needs to be done with sincerity, without becoming attached to praise.",
  "3-21": "Your actions can influence others. Try to model the values you hope to see around you.",
  "4-7": "When things feel difficult, remember that standing up for what is right begins with your own choices.",
  "4-8": "Choose to support truth, fairness and goodness through practical actions in everyday life.",
  "4-38": "Learning and wisdom grow through sincere effort, reflection and experience.",
  "5-10": "Act responsibly while letting go of unnecessary pride in being the doer.",
  "6-5": "Encourage yourself through constructive habits. Your choices can help you become your own support.",
  "6-6": "Train your mind to become a helpful companion through patience and consistent practice.",
  "6-26": "When your attention wanders, gently bring it back. Progress comes through repeated practice.",
  "6-35": "A restless mind can be trained through practice and detachment, one step at a time.",
  "9-22": "Give sincere attention to what matters and trust that steady commitment has value.",
  "9-26": "Sincerity matters more than grand gestures. Offer your best with a genuine heart.",
  "10-20": "Recognize the value of life and the sacredness of existence in the world around you.",
  "12-13": "Practice kindness, compassion and freedom from unnecessary hostility.",
  "12-14": "Cultivate patience, contentment and steady commitment in your daily life.",
  "12-15": "Try to be a source of calm rather than distress in your relationships.",
  "12-16": "Act with care, fairness and emotional steadiness.",
  "12-17": "Let go of excessive attachment to pleasant and unpleasant experiences.",
  "12-18": "Treat people with fairness and try not to be ruled by praise or criticism.",
  "12-19": "Practice steadiness when circumstances are comfortable and when they are challenging.",
  "12-20": "Keep learning and living with sincerity, trust and commitment to what is good.",
  "14-26": "Steady devotion and sincere practice can help you rise above changing moods.",
  "16-1": "Build qualities such as courage, honesty, self-control and generosity through daily choices.",
  "18-46": "You can find meaning in ordinary responsibilities when you approach them with care.",
  "18-47": "Do your own responsibilities sincerely rather than constantly comparing your path with others.",
  "18-63": "Reflect carefully, understand your choices and take responsibility for your decisions.",
  "18-66": "Let go of fear and seek refuge in the highest truth. Different traditions explain this verse in different ways."
};

function getDateInNepal(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayNumber(date: string): number {
  const start = Date.UTC(2026, 0, 1);
  const current = Date.parse(`${date}T00:00:00Z`);
  return Math.floor((current - start) / 86_400_000);
}

export function getVerse(key: string, language: "en" | "hi" = "en"): VerseRecord | null {
  const source = base[key];
  if (!source) return null;

  const translationData = language === "hi" ? hindi[key] : english[key];
  const fallback = english[key];

  return {
    key,
    chapter: source.chapter,
    verse: source.verse,
    chapterName: source.chapterNameTranslation || source.chapterName || `Chapter ${source.chapter}`,
    sanskrit: source.sanskrit || "",
    transliteration: source.transliteration || "",
    translation: translationData?.translation || fallback?.translation || "Translation unavailable.",
    reflection: reflections[key] || "Take a quiet moment to consider how this teaching might guide one choice you make today."
  };
}

export function getDailyVerse(date = getDateInNepal(), language: "en" | "hi" = "en"): VerseRecord {
  const index = ((dayNumber(date) % FEATURED_KEYS.length) + FEATURED_KEYS.length) % FEATURED_KEYS.length;
  const verse = getVerse(FEATURED_KEYS[index], language);
  if (!verse) throw new Error("The selected verse is missing from the dataset.");
  return verse;
}

export function getRandomVerse(language: "en" | "hi" = "en"): VerseRecord {
  const key = FEATURED_KEYS[Math.floor(Math.random() * FEATURED_KEYS.length)];
  const verse = getVerse(key, language);
  if (!verse) throw new Error("Could not load a random verse.");
  return verse;
}

export function getChapterHighlights(
  chapterNumber: number,
  language: "en" | "hi" = "en"
): VerseRecord[] {
  return FEATURED_KEYS
    .filter((key) => key.startsWith(`${chapterNumber}-`))
    .slice(0, 3)
    .map((key) => getVerse(key, language))
    .filter((verse): verse is VerseRecord => verse !== null);
}

export function formatVerse(verse: VerseRecord, language: "en" | "hi" = "en"): string {
  const title = language === "hi" ? "आज का भगवद्गीता ज्ञान" : "Today's Bhagavad Gita Wisdom";
  const meaning = language === "hi" ? "अर्थ" : "Meaning";
  const reflection = language === "hi" ? "आज का उपदेश" : "Today's Upadesh";
  const reference = language === "hi" ? "अध्याय" : "Chapter";

  return [
    `🙏 <b>${title}</b>`,
    `<b>${reference} ${verse.chapter}, Verse ${verse.verse}</b> · ${escapeHtml(verse.chapterName)}`,
    "",
    `<b>${escapeHtml(verse.sanskrit)}</b>`,
    "",
    verse.transliteration ? `<i>${escapeHtml(verse.transliteration)}</i>` : "",
    "",
    `<b>${meaning}:</b>`,
    escapeHtml(verse.translation),
    "",
    `<b>🌱 ${reflection}:</b>`,
    escapeHtml(verse.reflection),
    "",
    `<i>📖 Bhagavad Gita ${verse.chapter}.${verse.verse}</i>`
  ].filter(Boolean).join("\n");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function nepalDate(): string {
  return getDateInNepal();
}
