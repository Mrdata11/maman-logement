import fs from "fs";
import path from "path";
import crypto from "crypto";
import { OutreachData } from "./types";

const OUTREACH_FILENAME = "outreach.json";

/**
 * Cherche le repertoire de donnees des retraites (meme logique que retreats/data.ts).
 */
function findRetreatDataDir(): string {
  const candidates = [
    path.join(process.cwd(), "..", "data", "retreats"),
    path.join(process.cwd(), "data", "retreats"),
    path.join(process.cwd(), "public", "data", "retreats"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  // Creer le premier repertoire candidat s'il n'existe pas
  fs.mkdirSync(candidates[0], { recursive: true });
  return candidates[0];
}

/**
 * Lit les donnees d'outreach depuis outreach.json.
 */
export function getOutreachData(): OutreachData {
  const dataDir = findRetreatDataDir();
  const filepath = path.join(dataDir, OUTREACH_FILENAME);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(content) as OutreachData;
  } catch {
    // Fichier inexistant ou invalide : retourner des donnees vides
    return { campaigns: [], contacts: [] };
  }
}

/**
 * Sauvegarde les donnees d'outreach dans outreach.json.
 */
export function saveOutreachData(data: OutreachData): void {
  const dataDir = findRetreatDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  const filepath = path.join(dataDir, OUTREACH_FILENAME);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Genere un token unique pour le formulaire d'inscription d'un lieu.
 */
export function generateFormToken(): string {
  return crypto.randomUUID();
}
