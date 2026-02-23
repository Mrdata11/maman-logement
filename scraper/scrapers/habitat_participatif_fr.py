"""Scraper for basededonnees-habitatparticipatif-oasis.fr (French national database).

Uses the YesWiki API endpoint /?api/entries/1 which returns all project entries as JSON.
Scrapes ALL active French housing projects (no geographic filter).
"""

import json
import hashlib
import re
from datetime import datetime
from typing import List, Optional
from bs4 import BeautifulSoup

from scraper.scrapers.base import BaseScraper
from scraper.models import Listing
from scraper.config import ALL_DEPARTMENTS_FR


class HabitatParticipatifFRScraper(BaseScraper):
    """Scrapes the French national Habitat Participatif & Oasis database via API."""

    name = "habitatparticipatif-oasis.fr"
    base_url = "https://www.basededonnees-habitatparticipatif-oasis.fr"
    api_url = "https://www.basededonnees-habitatparticipatif-oasis.fr/?api/entries/1"

    def scrape(self) -> List[Listing]:
        listings = []

        print(f"  [{self.name}] Fetching all entries via API...")

        try:
            resp = self._rate_limited_get(self.api_url)
            data = resp.json()
        except Exception as e:
            print(f"  [{self.name}] Error fetching API: {e}")
            return listings

        if not isinstance(data, dict):
            print(f"  [{self.name}] Unexpected API response format")
            return listings

        print(f"  [{self.name}] API returned {len(data)} total entries")

        # Filter: type-1 (projects), active only — no geographic filter
        for entry_key, entry in data.items():
            if entry.get("id_typeannonce") != "1":
                continue

            # Only active projects
            if entry.get("listeListeEtatProjet") == "arrete":
                continue

            listing = self._parse_entry(entry)
            if listing:
                listings.append(listing)

        print(f"  [{self.name}] Total: {len(listings)} listings scraped")
        return listings

    def _parse_entry(self, entry: dict) -> Optional[Listing]:
        title = entry.get("bf_titre", "").strip()
        if not title:
            return None

        url = entry.get("url", "")
        if not url:
            entry_id = entry.get("id_fiche", "")
            url = f"{self.base_url}/?{entry_id}" if entry_id else ""

        # Build description from multiple text fields
        desc_parts = []
        short_desc = entry.get("bf_descriptif_court", "")
        if short_desc:
            desc_parts.append(short_desc.strip())

        long_desc = entry.get("bf_descriptif_long", "")
        if long_desc:
            # Remove HTML tags
            clean = BeautifulSoup(long_desc, "lxml").get_text(separator="\n", strip=True)
            if clean and clean != short_desc:
                desc_parts.append(clean)

        intentions = entry.get("bf_intentions", "")
        if intentions:
            desc_parts.append(f"Valeurs et intentions : {intentions.strip()}")

        social_life = entry.get("bf_viesociale", "")
        if social_life:
            desc_parts.append(f"Vie sociale : {social_life.strip()}")

        participation = entry.get("bf_participation", "")
        if participation:
            desc_parts.append(f"Participation : {participation.strip()}")

        description = "\n\n".join(desc_parts)
        if len(description) < 30:
            return None

        # Location
        city = entry.get("bf_ville", "")
        dept_code = str(entry.get("listeListeDepartement", ""))
        dept_name = ALL_DEPARTMENTS_FR.get(dept_code, dept_code)
        location = f"{city}, {dept_name}" if city else dept_name

        # Price
        price_str = entry.get("bf_prix_locatif", "")
        price_amount = None
        if price_str:
            try:
                price_amount = float(re.sub(r"[^\d.]", "", str(price_str)))
            except (ValueError, TypeError):
                pass

        # Contact
        contact_parts = []
        for field in ("bf_nom", "bf_prenom"):
            val = entry.get(field, "")
            if val:
                contact_parts.append(val.strip())
        for field in ("bf_mail", "bf_mail1", "bf_tel"):
            val = entry.get(field, "")
            if val:
                contact_parts.append(val.strip())
        contact = " | ".join(contact_parts) if contact_parts else None

        # Images
        images = []
        img = entry.get("imagebf_image", "")
        if img:
            images.append(f"{self.base_url}/cache/{img}")
        photo = entry.get("fichierphoto", "")
        if photo and photo != img:
            images.append(f"{self.base_url}/cache/{photo}")

        # Listing type based on project status
        group_status = entry.get("listeListeAvancementGroupe", "")
        if group_status == "recherchehabitant":
            listing_type = "creation-groupe"
        elif group_status in ("complet", "constitue"):
            listing_type = "existing-project"
        else:
            listing_type = "existing-project"

        # Date
        date_created = entry.get("date_creation_fiche", "")
        date_updated = entry.get("date_maj_fiche", "")
        date_published = date_updated or date_created

        # Structured metadata
        meta_parts = []

        nb_logements = entry.get("bf_nblogement", "")
        nb_foyers = entry.get("bf_nbfoyeractuel", "")
        if nb_logements or nb_foyers:
            size_info = []
            if nb_logements:
                size_info.append(f"{nb_logements} logements")
            if nb_foyers:
                size_info.append(f"{nb_foyers} foyers actuels")
            meta_parts.append(f"Taille : {', '.join(size_info)}")

        LOC_TYPE_LABELS = {
            "urbain": "Urbain", "periurbain": "Periurbain",
            "rural": "Rural", "rural-isole": "Rural isole",
        }
        loc_type = entry.get("listeListeTypeDeLocalisation", "")
        if loc_type and loc_type in LOC_TYPE_LABELS:
            meta_parts.append(f"Cadre : {LOC_TYPE_LABELS[loc_type]}")

        ARCH_LABELS = {
            "immeuble": "Immeuble", "intermediaire": "Intermediaire",
            "individuel": "Individuel", "ancien": "Ancien renove",
            "leger": "Habitat leger", "mixte": "Mixte",
        }
        arch = entry.get("listeListeTypeDArchitecture", "")
        if arch and arch in ARCH_LABELS:
            meta_parts.append(f"Architecture : {ARCH_LABELS[arch]}")

        STRUCT_LABELS = {
            "coop": "Cooperative", "sci": "SCI", "asso": "Association",
            "copro": "Copropriete", "scia": "SCIA",
        }
        struct = entry.get("listeListeStructuresJuridiques", "")
        if struct and struct in STRUCT_LABELS:
            meta_parts.append(f"Structure : {STRUCT_LABELS[struct]}")

        AVANCEMENT_LABELS = {
            "recherche": "En recherche de terrain",
            "etudes": "En etudes", "travaux": "En travaux",
            "abouti": "Abouti / Habite",
        }
        avancement = entry.get("listeListeAvancementProjet", "")
        if avancement and avancement in AVANCEMENT_LABELS:
            meta_parts.append(f"Avancement : {AVANCEMENT_LABELS[avancement]}")

        if group_status == "recherchehabitant":
            meta_parts.append("Recherche de nouveaux habitants")

        if meta_parts:
            description += "\n\n" + " · ".join(meta_parts)

        # Website
        website = entry.get("bf_site_internet", "")
        if website:
            description += f"\n\nSite web : {website}"

        return Listing(
            source=self.name,
            source_url=url,
            title=title,
            description=description[:5000],
            location=location,
            province=dept_name,
            price=str(price_amount) + "\u20ac" if price_amount else price_str or None,
            price_amount=price_amount,
            listing_type=listing_type,
            country="FR",
            original_language="fr",
            contact=contact,
            images=images[:5],
            date_published=date_published,
            date_scraped=datetime.utcnow().isoformat(),
        )
