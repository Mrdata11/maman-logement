from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
import hashlib


class Listing(BaseModel):
    id: str = ""
    source: str  # e.g. "habitat-groupe.be"
    source_url: str
    title: str
    description: str
    location: Optional[str] = None
    province: Optional[str] = None
    price: Optional[str] = None
    price_amount: Optional[float] = None
    listing_type: Optional[str] = None  # "offre-location", "offre-vente", "creation-groupe", etc.
    country: Optional[str] = None  # "BE", "FR", "ES", "PT", "NL", "CH"
    original_language: Optional[str] = None  # "fr", "nl", "es", "en", "pt"
    contact: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    date_published: Optional[str] = None
    date_scraped: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    def model_post_init(self, __context) -> None:
        if not self.id:
            self.id = hashlib.md5(self.source_url.encode()).hexdigest()[:12]
        if not self.date_scraped:
            self.date_scraped = datetime.utcnow().isoformat()


class Evaluation(BaseModel):
    listing_id: str
    quality_score: int = Field(ge=0, le=100)  # Objective quality/completeness score
    quality_summary: str  # Generic summary of the project
    highlights: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    availability_status: str = "unknown"  # "likely_available", "possibly_expired", "unknown"
    data_quality_score: int = Field(default=5, ge=0, le=10)
    ai_title: Optional[str] = None
    ai_description: Optional[str] = None
    date_evaluated: str = ""

    def model_post_init(self, __context) -> None:
        if not self.date_evaluated:
            self.date_evaluated = datetime.utcnow().isoformat()


class ListingTags(BaseModel):
    listing_id: str

    # Composition du groupe
    group_size: Optional[int] = None
    age_range: List[str] = Field(default_factory=list)
    has_children: Optional[bool] = None
    family_types: List[str] = Field(default_factory=list)

    # Type de projet
    project_types: List[str] = Field(default_factory=list)

    # Animaux
    pets_allowed: Optional[bool] = None
    pet_details: List[str] = Field(default_factory=list)

    # Logement
    surface_m2: Optional[int] = None
    num_bedrooms: Optional[int] = None
    unit_type: Optional[str] = None
    furnished: Optional[bool] = None
    accessible_pmr: Optional[bool] = None

    # Espaces partagés
    shared_spaces: List[str] = Field(default_factory=list)

    # Valeurs et activités
    values: List[str] = Field(default_factory=list)

    # Vie communautaire
    shared_meals: Optional[str] = None
    has_charter: Optional[bool] = None
    governance: Optional[str] = None

    # Cadre
    environment: Optional[str] = None
    near_nature: Optional[bool] = None
    near_transport: Optional[bool] = None

    date_extracted: str = ""

    def model_post_init(self, __context) -> None:
        if not self.date_extracted:
            self.date_extracted = datetime.utcnow().isoformat()
