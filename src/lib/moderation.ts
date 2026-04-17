const BLOCKED_WORDS = [
  // English profanity
  "fuck",
  "fucking",
  "fucker",
  "fucked",
  "fuk",
  "fck",
  "shit",
  "shitty",
  "bullshit",
  "bitch",
  "bitches",
  "biatch",
  "bastard",
  "asshole",
  "ass",
  "jackass",
  "motherfucker",
  "motherfucking",
  "mf",
  "cunt",
  "dick",
  "dickhead",
  "pussy",
  "slut",
  "slutty",
  "whore",
  "idiot",
  "stupid",
  "moron",
  "dumb",
  "loser",
  "scumbag",
  "jerk",
  "retard",
  "retarded",
  "porn",
  "porno",
  "horny",

  // Roman Urdu / Hindi (South Asia)
  "haramzada",
  "haramzadi",
  "harami",
  "kamina",
  "kameena",
  "kanjar",
  "kanjri",
  "randi",
  "rand",
  "randi ka bachy",
  "chinal",
  "gandu",
  "gaand",
  "gand",
  "lund",
  "lauda",
  "lora",
  "chut",
  "choot",
  "chus",
  "chutiya",
  "chutiye",
  "chutia",
  "chutiapa",
  "chootiya",
  "chuitya",
  "chuutiya",
  "bhosri",
  "bhosdike",
  "bsdk",
  "bhosdk",
  "bhadwa",
  "bhadwe",
  "madarchod",
  "madarchot",
  "madarjat",
  "behenchod",
  "behnchod",
  "behenchot",
  "bhenchod",
  "bhnchod",
  "bc",
  "mc",
  "hijra",
  "khusra",
  "chakka",
  "ullu ka pattha",
  "ullu ka patha",
  "suar",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const blockedAlternation = BLOCKED_WORDS.map(escapeRegex).join("|");
const blockedPattern = new RegExp(`\\b(${blockedAlternation})\\b`, "i");
const blockedPatternGlobal = new RegExp(`\\b(${blockedAlternation})\\b`, "gi");

export function containsAbusiveLanguage(input?: string | null) {
  if (!input) return false;
  return blockedPattern.test(input.trim());
}

export function censorAbusiveLanguage(input?: string | null) {
  if (!input) return input ?? null;
  return input.replace(blockedPatternGlobal, (match) => "*".repeat(match.length));
}
