"""Déduplication cross-source pour les lieux de retraite.

Stratégies de détection de doublons :
1. Même domaine website → merge
2. Proximité géographique (<500m) + similarité de nom (Levenshtein < 3) → merge
3. Même email ou téléphone → merge

La fusion garde l'enregistrement le plus complet et comble les champs nuls
depuis l'enregistrement secondaire.
"""

import math
import re
from typing import Optional
from urllib.parse import urlparse

from scraper.retreat_scrapers.retreat_models import RetreatVenueListing


# === Distance de Levenshtein ===

def levenshtein_distance(s1: str, s2: str) -> int:
    """Calcule la distance de Levenshtein entre deux chaînes."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def normalize_name(name: str) -> str:
    """Normalise un nom de lieu pour la comparaison."""
    name = name.lower().strip()
    # Retirer les mots courants non distinctifs
    stop_words = {
        "retreat", "center", "centre", "yoga", "meditation",
        "the", "le", "la", "les", "de", "du", "des", "et",
    }
    words = [w for w in re.split(r"\s+", name) if w not in stop_words]
    return " ".join(words)


# === Distance géographique (Haversine) ===

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance en mètres entre deux points GPS via la formule Haversine."""
    R = 6371000  # Rayon de la Terre en mètres

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


# === Extraction de domaine ===

def extract_domain(url: Optional[str]) -> Optional[str]:
    """Extrait le domaine racine d'une URL."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # Retirer www. prefix
        if domain.startswith("www."):
            domain = domain[4:]
        return domain or None
    except Exception:
        return None


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalise un numéro de téléphone en ne gardant que les chiffres."""
    if not phone:
        return None
    digits = re.sub(r"[^\d+]", "", phone)
    # Garder au moins 8 chiffres pour être valide
    if len(digits.replace("+", "")) < 8:
        return None
    return digits


# === Compteur de complétude ===

def completeness_score(venue: RetreatVenueListing) -> int:
    """Compte le nombre de champs non-nuls / non-vides d'une venue."""
    score = 0
    data = venue.model_dump()
    for key, value in data.items():
        if key in ("id", "source", "source_url", "date_scraped"):
            continue
        if value is None:
            continue
        if isinstance(value, (list, dict)) and len(value) == 0:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        score += 1
    return score


# === Fusion ===

def merge_venues(primary: RetreatVenueListing, secondary: RetreatVenueListing) -> RetreatVenueListing:
    """Fusionne deux venues en gardant les données de la primaire et comblant les trous.

    La primaire est celle avec le score de complétude le plus élevé.
    """
    primary_data = primary.model_dump()
    secondary_data = secondary.model_dump()

    merged = {}
    for key in primary_data:
        p_val = primary_data[key]
        s_val = secondary_data.get(key)

        if key in ("id", "source", "source_url", "date_scraped"):
            # Garder les valeurs de la primaire
            merged[key] = p_val
            continue

        # Si la valeur primaire est nulle/vide, utiliser la secondaire
        if p_val is None:
            merged[key] = s_val
        elif isinstance(p_val, list) and len(p_val) == 0 and isinstance(s_val, list) and len(s_val) > 0:
            merged[key] = s_val
        elif isinstance(p_val, dict) and len(p_val) == 0 and isinstance(s_val, dict) and len(s_val) > 0:
            merged[key] = s_val
        elif isinstance(p_val, str) and not p_val.strip() and isinstance(s_val, str) and s_val.strip():
            merged[key] = s_val
        else:
            merged[key] = p_val

        # Pour les listes, fusionner les éléments uniques
        if isinstance(p_val, list) and isinstance(s_val, list) and len(p_val) > 0 and len(s_val) > 0:
            combined = list(p_val)
            for item in s_val:
                if item not in combined:
                    combined.append(item)
            merged[key] = combined

    return RetreatVenueListing(**merged)


# === Déduplication principale ===

def deduplicate(venues: list[RetreatVenueListing]) -> list[RetreatVenueListing]:
    """Déduplique une liste de venues en utilisant 3 stratégies.

    Retourne la liste dédupliquée avec les enregistrements fusionnés.
    """
    if len(venues) <= 1:
        return venues

    # Index les venues par différentes clés
    n = len(venues)
    # parent[i] = index du parent dans l'union-find
    parent = list(range(n))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i: int, j: int):
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[ri] = rj

    # Construire les index
    domain_index: dict[str, list[int]] = {}
    email_index: dict[str, list[int]] = {}
    phone_index: dict[str, list[int]] = {}

    for idx, venue in enumerate(venues):
        # Index par domaine website
        domain = extract_domain(venue.website)
        if domain:
            domain_index.setdefault(domain, []).append(idx)

        # Index par email
        if venue.contact_email:
            email_key = venue.contact_email.lower().strip()
            email_index.setdefault(email_key, []).append(idx)

        # Index par téléphone
        phone_key = normalize_phone(venue.contact_phone)
        if phone_key:
            phone_index.setdefault(phone_key, []).append(idx)

    # Stratégie 1 : Même domaine website → merge
    for domain, indices in domain_index.items():
        if len(indices) > 1:
            for i in range(1, len(indices)):
                union(indices[0], indices[i])
                print(f"  [dedup] Même domaine '{domain}': '{venues[indices[0]].name}' + '{venues[indices[i]].name}'")

    # Stratégie 2 : Proximité géo (<500m) + nom similaire (Levenshtein < 3)
    for i in range(n):
        if venues[i].latitude is None or venues[i].longitude is None:
            continue
        for j in range(i + 1, n):
            if find(i) == find(j):
                continue
            if venues[j].latitude is None or venues[j].longitude is None:
                continue

            dist = haversine_distance(
                venues[i].latitude, venues[i].longitude,
                venues[j].latitude, venues[j].longitude,
            )
            if dist < 500:  # < 500 mètres
                name_i = normalize_name(venues[i].name)
                name_j = normalize_name(venues[j].name)
                lev_dist = levenshtein_distance(name_i, name_j)
                if lev_dist < 3:
                    union(i, j)
                    print(
                        f"  [dedup] Proximité ({dist:.0f}m) + nom similaire "
                        f"(lev={lev_dist}): '{venues[i].name}' + '{venues[j].name}'"
                    )

    # Stratégie 3 : Même email ou téléphone → merge
    for email, indices in email_index.items():
        if len(indices) > 1:
            for i in range(1, len(indices)):
                if find(indices[0]) != find(indices[i]):
                    union(indices[0], indices[i])
                    print(f"  [dedup] Même email '{email}': '{venues[indices[0]].name}' + '{venues[indices[i]].name}'")

    for phone, indices in phone_index.items():
        if len(indices) > 1:
            for i in range(1, len(indices)):
                if find(indices[0]) != find(indices[i]):
                    union(indices[0], indices[i])
                    print(f"  [dedup] Même téléphone '{phone}': '{venues[indices[0]].name}' + '{venues[indices[i]].name}'")

    # Regrouper par cluster
    clusters: dict[int, list[int]] = {}
    for i in range(n):
        root = find(i)
        clusters.setdefault(root, []).append(i)

    # Fusionner chaque cluster
    result: list[RetreatVenueListing] = []
    merged_count = 0
    for root, members in clusters.items():
        if len(members) == 1:
            result.append(venues[members[0]])
        else:
            # Trier par complétude décroissante, le plus complet est la primaire
            sorted_members = sorted(members, key=lambda idx: completeness_score(venues[idx]), reverse=True)
            merged = venues[sorted_members[0]]
            for idx in sorted_members[1:]:
                merged = merge_venues(merged, venues[idx])
            result.append(merged)
            merged_count += len(members) - 1

    print(f"  [dedup] {n} venues → {len(result)} venues ({merged_count} doublons fusionnés)")
    return result
