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


# === Apartment models (Brussels apartment search) ===

class ApartmentListing(BaseModel):
    id: str = ""
    source: str  # "immoweb.be"
    source_url: str
    title: str
    description: str

    # Location
    commune: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Pricing
    price_monthly: Optional[float] = None
    charges_monthly: Optional[float] = None
    charges_included: Optional[bool] = None

    # Property details
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    surface_m2: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    has_elevator: Optional[bool] = None

    # Energy
    peb_rating: Optional[str] = None  # A, B, C, D, E, F, G
    peb_value: Optional[float] = None  # kWh/m2/year

    # Amenities
    furnished: Optional[bool] = None
    has_balcony: Optional[bool] = None
    has_terrace: Optional[bool] = None
    has_garden: Optional[bool] = None
    has_parking: Optional[bool] = None
    parking_count: Optional[int] = None
    has_cellar: Optional[bool] = None
    pets_allowed: Optional[bool] = None

    # Dates
    available_from: Optional[str] = None
    date_published: Optional[str] = None
    date_scraped: str = ""

    # Media
    images: List[str] = Field(default_factory=list)

    # Agency
    agency_name: Optional[str] = None
    agency_phone: Optional[str] = None

    # Immoweb-specific
    immoweb_id: Optional[int] = None

    def model_post_init(self, __context) -> None:
        if not self.id:
            self.id = hashlib.md5(self.source_url.encode()).hexdigest()[:12]
        if not self.date_scraped:
            self.date_scraped = datetime.utcnow().isoformat()


class ApartmentCriteriaScore(BaseModel):
    price_budget: int = Field(ge=0, le=10)
    bedroom_count: int = Field(ge=0, le=10)
    proximity_ixelles: int = Field(ge=0, le=10)
    surface_area: int = Field(ge=0, le=10)
    condition_energy: int = Field(ge=0, le=10)
    amenities: int = Field(ge=0, le=10)
    transport_access: int = Field(ge=0, le=10)
    value_for_money: int = Field(ge=0, le=10)


class ApartmentEvaluation(BaseModel):
    listing_id: str
    overall_score: int = Field(ge=0, le=100)
    match_summary: str
    criteria_scores: ApartmentCriteriaScore
    highlights: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    date_evaluated: str = ""

    def model_post_init(self, __context) -> None:
        if not self.date_evaluated:
            self.date_evaluated = datetime.utcnow().isoformat()
