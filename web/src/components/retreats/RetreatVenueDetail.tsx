"use client";

import {
  RetreatVenueWithEval,
  COUNTRY_LABELS,
  COUNTRY_FLAGS,
  SETTING_LABELS,
  STYLE_LABELS,
  ACTIVITY_SPACE_LABELS,
  OUTDOOR_SPACE_LABELS,
  MEAL_SERVICE_LABELS,
  CUISINE_LABELS,
  SERVICE_LABELS,
  SUITABLE_FOR_LABELS,
  ACCOMMODATION_LABELS,
  ALCOHOL_POLICY_LABELS,
  RETREAT_CRITERIA_LABELS,
  RetreatCriteriaScores,
} from "@/lib/retreats/types";
import { RetreatImageGallery } from "./RetreatImageGallery";

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 8 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-rose-400";
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-48 text-gray-600 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-gray-700">{score}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">{title}</h2>
      {children}
    </section>
  );
}

function TagList({ items, labels }: { items: string[]; labels: Record<string, string> }) {
  if (items.length === 0) return <span className="text-sm text-gray-400">Non renseign\u00e9</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
          {labels[item] || item}
        </span>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}

function BooleanBadge({ value, trueLabel, falseLabel }: { value: boolean | null; trueLabel: string; falseLabel: string }) {
  if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${value ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

export function RetreatVenueDetail({ item }: { item: RetreatVenueWithEval }) {
  const { venue, evaluation, tags } = item;

  const countryLabel = venue.country ? COUNTRY_LABELS[venue.country] || venue.country : null;
  const countryFlag = venue.country ? COUNTRY_FLAGS[venue.country] || "" : "";

  const priceDisplay = venue.price_per_person_per_night
    ? `${venue.price_per_person_per_night}${venue.price_per_person_per_night_max && venue.price_per_person_per_night_max !== venue.price_per_person_per_night ? ` - ${venue.price_per_person_per_night_max}` : ""} ${venue.currency || "EUR"} / personne / nuit`
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <a href="/retraites" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Retour aux lieux
      </a>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{venue.name}</h1>
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span>
          {countryFlag} {venue.city}{venue.region ? `, ${venue.region}` : ""}{countryLabel ? ` - ${countryLabel}` : ""}
        </span>
        {venue.rating_average && (
          <span className="flex items-center gap-1 text-amber-600">
            <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            {venue.rating_average} ({venue.rating_count} avis)
          </span>
        )}
      </div>

      {/* Quick facts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {venue.capacity_max && (
          <span className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700">
            {venue.capacity_min ? `${venue.capacity_min}-` : ""}{venue.capacity_max} personnes
          </span>
        )}
        {priceDisplay && (
          <span className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-700">
            {priceDisplay}
          </span>
        )}
        {venue.num_practice_spaces && (
          <span className="text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700">
            {venue.num_practice_spaces} espace{venue.num_practice_spaces > 1 ? "s" : ""} de pratique
          </span>
        )}
        {venue.num_rooms && (
          <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {venue.num_rooms} chambres
          </span>
        )}
      </div>

      {/* Gallery */}
      <div className="mb-8">
        <RetreatImageGallery
          images={venue.images}
          imageCategories={venue.image_categories}
          name={venue.name}
        />
      </div>

      {/* AI Evaluation */}
      {evaluation && (
        <Section title="Evaluation">
          <div className="flex items-center gap-3 mb-4">
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
              evaluation.overall_score >= 80 ? "bg-emerald-50 text-emerald-700" :
              evaluation.overall_score >= 60 ? "bg-amber-50 text-amber-700" :
              "bg-rose-50 text-rose-700"
            }`}>
              {evaluation.overall_score}/100
            </div>
            <p className="text-sm text-gray-600 flex-1">{evaluation.match_summary}</p>
          </div>

          {/* Criteria scores */}
          <div className="space-y-2 mb-4">
            {(Object.keys(evaluation.criteria_scores) as (keyof RetreatCriteriaScores)[]).map((key) => (
              <ScoreBar
                key={key}
                score={evaluation.criteria_scores[key]}
                label={RETREAT_CRITERIA_LABELS[key]}
              />
            ))}
          </div>

          {/* Highlights & concerns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {evaluation.highlights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-1">Points forts</h4>
                <ul className="space-y-1">
                  {evaluation.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">+</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.concerns.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-rose-700 mb-1">Points d'attention</h4>
                <ul className="space-y-1">
                  {evaluation.concerns.map((c, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-rose-500 mt-0.5">-</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Best for */}
          {evaluation.best_for.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Id\u00e9al pour</h4>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.best_for.map((b) => (
                  <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                    {SUITABLE_FOR_LABELS[b] || b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Practice spaces */}
      <Section title="Espaces de pratique">
        <TagList items={venue.activity_spaces} labels={ACTIVITY_SPACE_LABELS} />
        <div className="mt-3 space-y-1">
          <InfoRow label="Espace principal" value={
            venue.main_practice_space_m2
              ? `${venue.main_practice_space_m2} m\u00b2${venue.main_practice_space_capacity ? ` (${venue.main_practice_space_capacity} pers.)` : ""}`
              : null
          } />
          <InfoRow label="Nombre d'espaces" value={venue.num_practice_spaces} />
        </div>
      </Section>

      {/* Accommodation */}
      <Section title="H\u00e9bergement">
        <TagList items={venue.accommodation_types} labels={ACCOMMODATION_LABELS} />
        <div className="mt-3 space-y-1">
          <InfoRow label="Chambres" value={venue.num_rooms} />
          <InfoRow label="Lits" value={venue.num_beds} />
          <InfoRow label="Salle de bain priv\u00e9e" value={
            venue.room_has_private_bathroom !== null ? (venue.room_has_private_bathroom ? "Oui" : "Non / partag\u00e9e") : null
          } />
        </div>
      </Section>

      {/* Dining */}
      <Section title="Restauration">
        <div className="space-y-1">
          <InfoRow label="Formule" value={venue.meal_service ? MEAL_SERVICE_LABELS[venue.meal_service] || venue.meal_service : null} />
          <InfoRow label="Repas inclus dans le prix" value={
            venue.meals_included_in_price !== null ? (venue.meals_included_in_price ? "Oui" : "Non") : null
          } />
          <InfoRow label="Acc\u00e8s cuisine" value={
            venue.kitchen_access !== null ? (venue.kitchen_access ? "Oui" : "Non") : null
          } />
          <InfoRow label="R\u00e9gimes sp\u00e9ciaux" value={
            venue.dietary_accommodations !== null ? (venue.dietary_accommodations ? "Pris en charge" : "Non") : null
          } />
        </div>
        <div className="mt-3">
          <span className="text-sm text-gray-500">Options cuisine :</span>
          <div className="mt-1">
            <TagList items={venue.cuisine_options} labels={CUISINE_LABELS} />
          </div>
        </div>
      </Section>

      {/* Outdoor & wellness */}
      <Section title="Espaces ext\u00e9rieurs & bien-\u00eatre">
        <TagList items={venue.outdoor_spaces} labels={OUTDOOR_SPACE_LABELS} />
      </Section>

      {/* Services */}
      <Section title="Services pour organisateurs">
        <TagList items={venue.services} labels={SERVICE_LABELS} />
      </Section>

      {/* Setting & style */}
      <Section title="Cadre & ambiance">
        <div className="mb-3">
          <span className="text-sm text-gray-500">Cadre :</span>
          <div className="mt-1">
            <TagList items={venue.setting} labels={SETTING_LABELS} />
          </div>
        </div>
        <div>
          <span className="text-sm text-gray-500">Style :</span>
          <div className="mt-1">
            <TagList items={venue.style} labels={STYLE_LABELS} />
          </div>
        </div>
      </Section>

      {/* Location & access */}
      <Section title="Localisation & acc\u00e8s">
        <div className="space-y-1">
          <InfoRow label="Pays" value={countryLabel ? `${countryFlag} ${countryLabel}` : null} />
          <InfoRow label="R\u00e9gion" value={venue.region} />
          <InfoRow label="Ville" value={venue.city} />
          <InfoRow label="A\u00e9roport le plus proche" value={venue.nearest_airport} />
          <InfoRow label="Navette a\u00e9roport" value={
            venue.transfer_available !== null ? (venue.transfer_available ? "Oui" : "Non") : null
          } />
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Tarifs">
        <div className="space-y-1">
          {venue.price_per_person_per_night && (
            <InfoRow
              label="Par personne / nuit"
              value={`${venue.price_per_person_per_night}${venue.price_per_person_per_night_max ? ` - ${venue.price_per_person_per_night_max}` : ""} ${venue.currency || "EUR"}`}
            />
          )}
          {venue.price_full_venue_per_day && (
            <InfoRow label="Lieu entier / jour" value={`${venue.price_full_venue_per_day} ${venue.currency || "EUR"}`} />
          )}
          <InfoRow label="Repas inclus" value={venue.meals_included_in_price ? "Oui" : "Non"} />
        </div>
        {venue.price_notes && (
          <p className="mt-2 text-sm text-gray-600 italic">{venue.price_notes}</p>
        )}
      </Section>

      {/* Rules */}
      <Section title="R\u00e8gles & politiques">
        <div className="space-y-1">
          <InfoRow label="Alcool" value={venue.alcohol_policy ? ALCOHOL_POLICY_LABELS[venue.alcohol_policy] || venue.alcohol_policy : null} />
          <InfoRow label="Enfants" value={
            venue.children_welcome !== null ? (venue.children_welcome ? "Bienvenus" : "Non adapt\u00e9") : null
          } />
          <InfoRow label="Accessible PMR" value={
            venue.accessible !== null ? (venue.accessible ? "Oui" : "Non") : null
          } />
        </div>
      </Section>

      {/* Availability */}
      <Section title="Disponibilit\u00e9">
        <div className="space-y-1">
          <InfoRow label="Ouvert toute l'ann\u00e9e" value={
            venue.available_year_round !== null ? (venue.available_year_round ? "Oui" : "Non (saisonnier)") : null
          } />
          <InfoRow label="S\u00e9jour minimum" value={venue.min_stay_nights ? `${venue.min_stay_nights} nuits` : null} />
          <InfoRow label="D\u00e9lai de r\u00e9servation" value={venue.lead_time_weeks ? `${venue.lead_time_weeks} semaines \u00e0 l'avance` : null} />
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <div className="space-y-1">
          {venue.contact_email && (
            <InfoRow label="Email" value={
              <a href={`mailto:${venue.contact_email}`} className="text-blue-600 hover:underline">{venue.contact_email}</a>
            } />
          )}
          {venue.contact_phone && (
            <InfoRow label="T\u00e9l\u00e9phone" value={venue.contact_phone} />
          )}
          {venue.website && (
            <InfoRow label="Site web" value={
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{venue.website}</a>
            } />
          )}
          {venue.booking_url && (
            <a
              href={venue.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
            >
              R\u00e9server / Contacter
            </a>
          )}
        </div>
      </Section>

      {/* Source */}
      <div className="text-xs text-gray-400 mt-8 border-t pt-4">
        Source : {venue.source} | Derni\u00e8re mise \u00e0 jour : {new Date(venue.date_scraped).toLocaleDateString("fr-FR")}
        {venue.source_url && (
          <> | <a href={venue.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Voir l'original</a></>
        )}
      </div>
    </div>
  );
}
