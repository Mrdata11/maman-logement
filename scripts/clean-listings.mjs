#!/usr/bin/env node
/**
 * Script de nettoyage des annonces poubelle via Haiku.
 * Envoie titre + début de description en batch, demande à Haiku de noter chaque annonce.
 * Supprime celles jugées non-pertinentes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Charger la clé API depuis web/.env.local
const envPath = path.join(ROOT, 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
if (!apiKeyMatch) {
  console.error('ANTHROPIC_API_KEY non trouvée dans web/.env.local');
  process.exit(1);
}
const API_KEY = apiKeyMatch[1].trim();

const LISTINGS_PATH = path.join(ROOT, 'data', 'listings.json');
const BACKUP_PATH = path.join(ROOT, 'data', 'listings.backup.json');
const BATCH_SIZE = 30; // réduit pour rester sous le rate limit

async function callHaiku(prompt, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.status === 429) {
      // Rate limited — attendre puis réessayer avec backoff exponentiel
      const retryAfter = res.headers.get('retry-after');
      const waitSec = retryAfter ? parseInt(retryAfter) : Math.min(5 * Math.pow(2, attempt), 60);
      console.log(`    ⏳ Rate limited, attente ${waitSec}s (tentative ${attempt + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.content[0].text;
  }
  throw new Error('Rate limit dépassé après plusieurs tentatives');
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

async function main() {
  // Charger les annonces
  const listings = JSON.parse(fs.readFileSync(LISTINGS_PATH, 'utf8'));
  console.log(`Total annonces: ${listings.length}`);

  // Backup (seulement si pas déjà fait)
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(listings, null, 2));
    console.log(`Backup sauvegardé: ${BACKUP_PATH}`);
  } else {
    console.log(`Backup existant conservé: ${BACKUP_PATH}`);
  }

  // Préparer les batches
  const batches = [];
  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    batches.push(listings.slice(i, i + BATCH_SIZE));
  }
  console.log(`${batches.length} batches de ~${BATCH_SIZE} annonces\n`);

  const idsToRemove = new Set();

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`Batch ${batchIdx + 1}/${batches.length} (${batch.length} annonces)...`);

    // Construire le prompt — titre + 150 chars de description max pour économiser les tokens
    const listingsText = batch.map((l, i) => {
      const desc = truncate(l.description, 150);
      return `${i + 1}. ID: ${l.id} | Titre: ${l.title} | Source: ${l.source} | Desc: ${desc}`;
    }).join('\n');

    const prompt = `Filtre ces annonces d'habitats partagés/colocations/écolieux/cohousing scrapées.

SUPPRIMER si : page de contact/formulaire/CGU/mentions légales, page de tag/catégorie/blog sans annonce concrète, article presse/actu (pas une annonce), page "à propos"/présentation sans offre de logement, titre 1 mot générique sans description, événement/atelier/conférence, fragment web inutile.

GARDER si : annonce concrète logement/colocation/habitat partagé/écolieu/cohousing, projet cherchant des membres, offre location/vente, recherche colocataires, communauté accueillant nouveaux membres.

ANNONCES:
${listingsText}

Réponds UNIQUEMENT avec un JSON array des IDs à SUPPRIMER. Ex: ["id1","id2"]. Si rien à supprimer: []`;

    try {
      const response = await callHaiku(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const toRemove = JSON.parse(jsonMatch[0]);
        toRemove.forEach(id => idsToRemove.add(id));
        if (toRemove.length > 0) {
          const removedTitles = batch
            .filter(l => toRemove.includes(l.id))
            .map(l => `  ✗ [${l.source}] ${truncate(l.title, 60)}`);
          console.log(`  → ${toRemove.length} à supprimer:\n${removedTitles.join('\n')}`);
        } else {
          console.log(`  → Toutes OK ✓`);
        }
      } else {
        console.log(`  ⚠ Réponse inattendue: ${truncate(response, 100)}`);
      }
    } catch (err) {
      console.error(`  ✗ Erreur: ${err.message.substring(0, 100)}`);
    }

    // Pause de 3s entre chaque batch pour respecter le rate limit de 50k tokens/min
    if (batchIdx < batches.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Filtrer et sauvegarder
  const cleaned = listings.filter(l => !idsToRemove.has(l.id));
  const removed = listings.length - cleaned.length;

  console.log(`\n========================================`);
  console.log(`Résultat: ${removed} annonces supprimées sur ${listings.length}`);
  console.log(`Annonces restantes: ${cleaned.length}`);
  console.log(`========================================`);

  fs.writeFileSync(LISTINGS_PATH, JSON.stringify(cleaned, null, 2));
  console.log(`\nFichier nettoyé sauvegardé: ${LISTINGS_PATH}`);
  console.log(`Backup disponible: ${BACKUP_PATH}`);
}

main().catch(console.error);
