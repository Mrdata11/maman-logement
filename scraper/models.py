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
    contact: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    date_published: Optional[str] = None
    date_scraped: str = ""

    def model_post_init(self, __context) -> None:
        if not self.id:
            self.id = hashlib.md5(self.source_url.encode()).hexdigest()[:12]
        if not self.date_scraped:
            self.date_scraped = datetime.utcnow().isoformat()


class CriteriaScore(BaseModel):
    community_size_and_maturity: int = Field(ge=0, le=10)
    values_alignment: int = Field(ge=0, le=10)
    common_projects: int = Field(ge=0, le=10)
    large_hall_biodanza: int = Field(ge=0, le=10)
    rental_price: int = Field(ge=0, le=10)
    unit_type: int = Field(ge=0, le=10)
    parking: int = Field(ge=0, le=10)
    spiritual_alignment: int = Field(ge=0, le=10)
    charter_openness: int = Field(ge=0, le=10)
    community_meals: int = Field(ge=0, le=10)
    location_brussels: int = Field(ge=0, le=10)
    near_hospital: int = Field(ge=0, le=10)


class Evaluation(BaseModel):
    listing_id: str
    overall_score: int = Field(ge=0, le=100)
    match_summary: str
    criteria_scores: CriteriaScore
    highlights: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    date_evaluated: str = ""

    def model_post_init(self, __context) -> None:
        if not self.date_evaluated:
            self.date_evaluated = datetime.utcnow().isoformat()
