"""Modèles Pydantic pour les lieux de retraite.

Correspond aux interfaces TypeScript RetreatVenue, RetreatVenueEvaluation
et RetreatVenueTags définies dans web/src/lib/retreats/types.ts.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict
import hashlib


class RetreatRoom(BaseModel):
    """Détail d'une chambre individuelle du lieu."""
    name: str                              # e.g. "Chambre Lavande", "Dortoir 1"
    type: str = "private_room"             # private_room, shared_room, dormitory, suite, etc.
    capacity: int = 2
    bed_type: str = "double"               # single, double, twin, bunk
    has_private_bathroom: bool = False
    has_view: Optional[bool] = None
    floor: Optional[int] = None            # 0 = RDC
    size_m2: Optional[float] = None
    amenities: List[str] = Field(default_factory=list)  # balcon, bureau, coffre-fort, etc.
    images: List[str] = Field(default_factory=list)


class RetreatPackageDeal(BaseModel):
    """Forfait type proposé par le lieu."""
    name: str                              # e.g. "Weekend Yoga 12 pers."
    duration_nights: int
    group_size: int
    price_total: float
    currency: str = "EUR"
    includes: List[str] = Field(default_factory=list)  # hébergement, repas, salle de yoga, etc.
    notes: Optional[str] = None


class RetreatTestimonial(BaseModel):
    """Témoignage d'un organisateur ayant utilisé le lieu."""
    author: str
    role: str = ""
    text: str
    rating: int = Field(ge=1, le=5, default=5)
    date: str = ""


class RetreatVenueListing(BaseModel):
    """Modèle principal d'un lieu de retraite.

    Correspond à l'interface TypeScript RetreatVenue.
    Tous les champs sont Optional sauf id, source, source_url, name, description, date_scraped.
    """
    # === Identité (obligatoires) ===
    id: str = ""
    source: str  # e.g. "retreat.guru", "bookyogaretreats.com", "google_places"
    source_url: str
    name: str
    description: str
    date_scraped: str = ""

    # === Localisation ===
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nearest_airport: Optional[str] = None
    transfer_available: Optional[bool] = None

    # === Capacité ===
    capacity_min: Optional[int] = None
    capacity_max: Optional[int] = None
    num_rooms: Optional[int] = None
    num_beds: Optional[int] = None

    # === Hébergement ===
    accommodation_types: List[str] = Field(default_factory=list)
    room_has_private_bathroom: Optional[bool] = None
    bed_configurations: List[str] = Field(default_factory=list)
    bed_linen_provided: Optional[bool] = None
    towels_provided: Optional[bool] = None

    # === Détail des chambres ===
    rooms: List[RetreatRoom] = Field(default_factory=list)

    # === Sanitaires ===
    num_bathrooms: Optional[int] = None
    num_shared_bathrooms: Optional[int] = None
    num_toilets: Optional[int] = None
    hot_water_type: Optional[str] = None
    bathroom_amenities: List[str] = Field(default_factory=list)

    # === Espaces de pratique ===
    activity_spaces: List[str] = Field(default_factory=list)
    main_practice_space_capacity: Optional[int] = None
    main_practice_space_m2: Optional[int] = None
    num_practice_spaces: Optional[int] = None
    practice_space_floor_type: Optional[str] = None
    practice_space_has_mirrors: Optional[bool] = None
    practice_space_natural_light: Optional[bool] = None
    practice_space_sound_insulation: Optional[bool] = None
    practice_space_climate_control: Optional[bool] = None

    # === Espaces extérieurs & bien-être ===
    outdoor_spaces: List[str] = Field(default_factory=list)
    pool_type: Optional[str] = None
    pool_dimensions: Optional[str] = None

    # === Restauration ===
    meal_service: Optional[str] = None
    cuisine_options: List[str] = Field(default_factory=list)
    kitchen_access: Optional[bool] = None
    dietary_accommodations: Optional[bool] = None
    kitchen_type: Optional[str] = None
    kitchen_capacity_persons: Optional[int] = None
    kitchen_equipment: List[str] = Field(default_factory=list)

    # === Tarifs ===
    currency: Optional[str] = None
    price_per_person_per_night: Optional[float] = None
    price_per_person_per_night_max: Optional[float] = None
    price_full_venue_per_day: Optional[float] = None
    price_notes: Optional[str] = None
    meals_included_in_price: Optional[bool] = None

    # === Prix saisonniers ===
    price_high_season: Optional[float] = None
    price_low_season: Optional[float] = None
    high_season_months: Optional[str] = None    # e.g. "Juin-Septembre"
    low_season_months: Optional[str] = None     # e.g. "Octobre-Mars"
    weekend_supplement: Optional[bool] = None

    # === Forfaits ===
    package_deals: List[RetreatPackageDeal] = Field(default_factory=list)

    # === Frais supplémentaires ===
    tourist_tax_per_person: Optional[float] = None
    heating_supplement: Optional[bool] = None
    security_deposit: Optional[float] = None
    cleaning_fee: Optional[float] = None
    linen_rental_available: Optional[bool] = None
    extra_bed_cost: Optional[float] = None

    # === Paiement ===
    payment_methods: List[str] = Field(default_factory=list)  # bank_transfer, credit_card, paypal, cash, crypto
    payment_installments: Optional[bool] = None
    contract_language: Optional[str] = None

    # === Cadre & style ===
    setting: List[str] = Field(default_factory=list)
    style: List[str] = Field(default_factory=list)

    # === Services pour organisateurs ===
    services: List[str] = Field(default_factory=list)

    # === Ménage ===
    cleaning_included: Optional[bool] = None
    cleaning_frequency: Optional[str] = None

    # === Personnel ===
    staff_on_site: Optional[bool] = None
    staff_count: Optional[int] = None
    staff_details: Optional[str] = None

    # === Types de retraites adaptés ===
    suitable_for: List[str] = Field(default_factory=list)

    # === Règles ===
    alcohol_policy: Optional[str] = None
    children_welcome: Optional[bool] = None
    accessible: Optional[bool] = None
    smoking_policy: Optional[str] = None
    pets_allowed: Optional[bool] = None

    # === Accessibilité détaillée ===
    ground_floor_rooms: Optional[int] = None
    elevator: Optional[bool] = None
    terrain_type: Optional[str] = None
    adapted_bathroom: Optional[bool] = None

    # === Photos & médias ===
    images: List[str] = Field(default_factory=list)
    image_categories: Dict[str, List[str]] = Field(default_factory=dict)
    video_url: Optional[str] = None              # YouTube, Vimeo, etc.
    virtual_tour_url: Optional[str] = None       # Matterport, 360°
    floor_plan_url: Optional[str] = None         # plan du lieu

    # === Contact ===
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    booking_url: Optional[str] = None

    # === Avis ===
    rating_average: Optional[float] = None
    rating_count: Optional[int] = None

    # === Disponibilité ===
    available_year_round: Optional[bool] = None
    min_stay_nights: Optional[int] = None
    lead_time_weeks: Optional[int] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None

    # === Langues parlées ===
    languages_spoken: List[str] = Field(default_factory=list)

    # === Réservation & politiques ===
    cancellation_policy: Optional[str] = None
    deposit_required: Optional[str] = None
    group_discount: Optional[bool] = None
    suggested_durations: List[int] = Field(default_factory=list)
    seasonal_availability: Optional[str] = None
    cancellation_insurance_available: Optional[bool] = None
    covid_flexible_policy: Optional[bool] = None
    average_response_time: Optional[str] = None  # e.g. "24h", "48h"

    # === Équipement spécialisé ===
    specialized_equipment: List[str] = Field(default_factory=list)

    # === Environnement & règles ===
    ceremonies_allowed: Optional[bool] = None
    silence_policy: Optional[str] = None
    noise_level: Optional[str] = None
    climate_info: Optional[str] = None

    # === Infrastructure technique ===
    wifi_speed: Optional[str] = None
    mobile_signal: Optional[str] = None
    backup_power: Optional[bool] = None

    # === Confort climatique ===
    heating_type: Optional[str] = None
    air_conditioning_type: Optional[str] = None
    mosquito_protection: Optional[bool] = None
    drinking_water_safe: Optional[bool] = None

    # === Sécurité & services de proximité ===
    nearest_hospital_km: Optional[float] = None
    nearest_pharmacy_km: Optional[float] = None
    nearest_grocery_km: Optional[float] = None
    nearest_restaurant_km: Optional[float] = None
    first_aid_kit: Optional[bool] = None
    fire_safety: Optional[bool] = None
    emergency_procedure: Optional[bool] = None

    # === Historique ===
    retreats_hosted_count: Optional[int] = None
    testimonials: List[RetreatTestimonial] = Field(default_factory=list)

    # === Modèle de location ===
    exclusive_hire_only: Optional[bool] = None

    # === Transport / logistique ===
    nearest_airport_km: Optional[float] = None
    nearest_train_station: Optional[str] = None
    nearest_train_station_km: Optional[float] = None
    nearest_town_km: Optional[float] = None
    parking_spaces: Optional[int] = None
    parking_type: Optional[str] = None

    # === Éco / durabilité ===
    eco_certifications: List[str] = Field(default_factory=list)
    sustainability_features: List[str] = Field(default_factory=list)

    # === Activités à proximité ===
    nearby_activities: List[str] = Field(default_factory=list)
    nearest_beach_km: Optional[float] = None

    # === Légal / assurance ===
    liability_insurance: Optional[bool] = None
    max_legal_occupancy: Optional[int] = None

    # === Métadonnées ===
    original_language: Optional[str] = None
    is_claimed: bool = False

    # === Champs d'outreach (contact extraction) ===
    contact_extraction_status: Optional[str] = None  # "pending", "extracted", "failed", "not_needed"
    contact_person_name: Optional[str] = None
    contact_person_role: Optional[str] = None
    social_instagram: Optional[str] = None
    social_facebook: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if not self.id:
            self.id = hashlib.md5(self.source_url.encode()).hexdigest()[:12]
        if not self.date_scraped:
            self.date_scraped = datetime.utcnow().isoformat()


class RetreatCriteriaScores(BaseModel):
    """Scores par critère pour l'évaluation d'un lieu de retraite."""
    practice_spaces_quality: int = Field(ge=0, le=10, default=0)
    accommodation_quality: int = Field(ge=0, le=10, default=0)
    capacity_flexibility: int = Field(ge=0, le=10, default=0)
    dining_quality: int = Field(ge=0, le=10, default=0)
    natural_setting: int = Field(ge=0, le=10, default=0)
    value_for_money: int = Field(ge=0, le=10, default=0)
    accessibility_transport: int = Field(ge=0, le=10, default=0)
    organizer_services: int = Field(ge=0, le=10, default=0)
    atmosphere_vibe: int = Field(ge=0, le=10, default=0)
    data_completeness: int = Field(ge=0, le=10, default=0)


class RetreatVenueEvaluation(BaseModel):
    """Évaluation IA d'un lieu de retraite.

    Correspond à l'interface TypeScript RetreatVenueEvaluation.
    """
    listing_id: str
    overall_score: int = Field(ge=0, le=100)
    match_summary: str
    criteria_scores: RetreatCriteriaScores
    highlights: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)
    best_for: List[str] = Field(default_factory=list)
    ai_title: Optional[str] = None
    ai_description: Optional[str] = None
    date_evaluated: str = ""

    def model_post_init(self, __context) -> None:
        if not self.date_evaluated:
            self.date_evaluated = datetime.utcnow().isoformat()


class RetreatVenueTags(BaseModel):
    """Tags structurés pour le filtrage rapide d'un lieu de retraite.

    Correspond à l'interface TypeScript RetreatVenueTags.
    """
    listing_id: str

    # Capacité
    capacity_range: Optional[str] = None  # "small", "medium", "large"

    # Hébergement
    accommodation_types: List[str] = Field(default_factory=list)
    has_private_rooms: Optional[bool] = None
    has_shared_rooms: Optional[bool] = None

    # Espaces de pratique
    has_yoga_studio: Optional[bool] = None
    has_meditation_hall: Optional[bool] = None
    has_outdoor_practice_space: Optional[bool] = None
    num_practice_spaces: Optional[int] = None

    # Extérieur & bien-être
    has_pool: Optional[bool] = None
    has_sauna_spa: Optional[bool] = None
    has_beach_access: Optional[bool] = None
    has_garden: Optional[bool] = None

    # Restauration
    meal_service: Optional[str] = None
    is_vegetarian: Optional[bool] = None
    is_vegan_friendly: Optional[bool] = None
    is_organic: Optional[bool] = None

    # Cadre & style
    setting: List[str] = Field(default_factory=list)
    style: List[str] = Field(default_factory=list)

    # Types de retraites
    suitable_for: List[str] = Field(default_factory=list)

    # Services
    has_airport_transfer: Optional[bool] = None
    has_wifi: Optional[bool] = None
    is_accessible: Optional[bool] = None

    # Règles
    alcohol_free: Optional[bool] = None
    children_welcome: Optional[bool] = None

    # Prix
    price_bracket: Optional[str] = None  # "budget", "mid_range", "premium", "luxury"

    # Nouveaux tags
    has_professional_kitchen: Optional[bool] = None
    bed_linen_provided: Optional[bool] = None
    towels_provided: Optional[bool] = None
    cleaning_included: Optional[bool] = None
    staff_on_site: Optional[bool] = None
    has_parking: Optional[bool] = None
    smoking_not_allowed: Optional[bool] = None
    pets_allowed: Optional[bool] = None
    has_heating: Optional[bool] = None
    has_ac: Optional[bool] = None
    drinking_water_safe: Optional[bool] = None
    first_aid_kit: Optional[bool] = None
    eco_friendly: Optional[bool] = None
    has_nearby_activities: Optional[bool] = None
    has_liability_insurance: Optional[bool] = None

    date_extracted: str = ""

    def model_post_init(self, __context) -> None:
        if not self.date_extracted:
            self.date_extracted = datetime.utcnow().isoformat()
