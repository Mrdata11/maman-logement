"use client";

import { useState } from "react";
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
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  SPECIALIZED_EQUIPMENT_LABELS,
  NOISE_LEVEL_LABELS,
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
  if (items.length === 0) return <span className="text-sm text-gray-400">Non renseigné</span>;
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
              <h4 className="text-sm font-medium text-gray-700 mb-1">Idéal pour</h4>
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
              ? `${venue.main_practice_space_m2} m²${venue.main_practice_space_capacity ? ` (${venue.main_practice_space_capacity} pers.)` : ""}`
              : null
          } />
          <InfoRow label="Nombre d'espaces" value={venue.num_practice_spaces} />
        </div>
      </Section>

      {/* Accommodation */}
      <Section title="Hébergement">
        <TagList items={venue.accommodation_types} labels={ACCOMMODATION_LABELS} />
        <div className="mt-3 space-y-1">
          <InfoRow label="Chambres" value={venue.num_rooms} />
          <InfoRow label="Lits" value={venue.num_beds} />
          <InfoRow label="Salle de bain privée" value={
            venue.room_has_private_bathroom !== null ? (venue.room_has_private_bathroom ? "Oui" : "Non / partagée") : null
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
          <InfoRow label="Accès cuisine" value={
            venue.kitchen_access !== null ? (venue.kitchen_access ? "Oui" : "Non") : null
          } />
          <InfoRow label="Régimes spéciaux" value={
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
      <Section title="Espaces extérieurs & bien-être">
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
        <div className="mb-3">
          <span className="text-sm text-gray-500">Style :</span>
          <div className="mt-1">
            <TagList items={venue.style} labels={STYLE_LABELS} />
          </div>
        </div>
        <div className="space-y-1">
          <InfoRow label="Niveau sonore" value={venue.noise_level ? NOISE_LEVEL_LABELS[venue.noise_level] || venue.noise_level : null} />
          <InfoRow label="Climat" value={venue.climate_info} />
        </div>
      </Section>

      {/* Languages */}
      {venue.languages_spoken && venue.languages_spoken.length > 0 && (
        <Section title="Langues parlées">
          <div className="flex flex-wrap gap-2">
            {venue.languages_spoken.map((lang) => (
              <span key={lang} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
                <span>{LANGUAGE_FLAGS[lang] || ""}</span>
                <span>{LANGUAGE_LABELS[lang] || lang}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Specialized equipment */}
      {venue.specialized_equipment && venue.specialized_equipment.length > 0 && (
        <Section title="Équipement spécialisé">
          <TagList items={venue.specialized_equipment} labels={SPECIALIZED_EQUIPMENT_LABELS} />
          <div className="mt-3 space-y-1">
            <InfoRow label="Cérémonies / encens / rituels" value={
              venue.ceremonies_allowed !== null && venue.ceremonies_allowed !== undefined
                ? (venue.ceremonies_allowed ? "Autorisé" : "Non autorisé")
                : null
            } />
            {venue.silence_policy && (
              <InfoRow label="Politique de silence" value={venue.silence_policy} />
            )}
          </div>
        </Section>
      )}

      {/* Booking policies */}
      {(venue.cancellation_policy || venue.deposit_required || venue.suggested_durations?.length > 0) && (
        <Section title="Conditions de réservation">
          <div className="space-y-1">
            {venue.suggested_durations && venue.suggested_durations.length > 0 && (
              <InfoRow label="Durées suggérées" value={venue.suggested_durations.map(d => `${d} nuits`).join(', ')} />
            )}
            <InfoRow label="Séjour minimum" value={venue.min_stay_nights ? `${venue.min_stay_nights} nuits` : null} />
            <InfoRow label="Délai de réservation" value={venue.lead_time_weeks ? `${venue.lead_time_weeks} semaines à l'avance` : null} />
            <InfoRow label="Location exclusive" value={
              venue.exclusive_hire_only !== null && venue.exclusive_hire_only !== undefined
                ? (venue.exclusive_hire_only ? "Oui (lieu entier uniquement)" : "Non (réservation partielle possible)")
                : null
            } />
            <InfoRow label="Réduction groupe" value={
              venue.group_discount !== null && venue.group_discount !== undefined
                ? (venue.group_discount ? "Oui, sur demande" : "Non")
                : null
            } />
            <InfoRow label="Saison" value={venue.seasonal_availability} />
          </div>
          {venue.deposit_required && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Acompte</h4>
              <p className="text-sm text-amber-700">{venue.deposit_required}</p>
            </div>
          )}
          {venue.cancellation_policy && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Politique d'annulation</h4>
              <p className="text-sm text-gray-600">{venue.cancellation_policy}</p>
            </div>
          )}
        </Section>
      )}

      {/* Track record */}
      {(venue.retreats_hosted_count || venue.nearest_hospital_km) && (
        <Section title="Expérience & sécurité">
          <div className="space-y-1">
            {venue.retreats_hosted_count && (
              <InfoRow label="Retraites organisées" value={`${venue.retreats_hosted_count}+`} />
            )}
            {venue.nearest_hospital_km && (
              <InfoRow label="Hôpital le plus proche" value={`${venue.nearest_hospital_km} km`} />
            )}
          </div>
        </Section>
      )}

      {/* Location & access */}
      <Section title="Localisation & accès">
        <div className="space-y-1">
          <InfoRow label="Pays" value={countryLabel ? `${countryFlag} ${countryLabel}` : null} />
          <InfoRow label="Région" value={venue.region} />
          <InfoRow label="Ville" value={venue.city} />
          <InfoRow label="Aéroport le plus proche" value={venue.nearest_airport} />
          <InfoRow label="Navette aéroport" value={
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
      <Section title="Règles & politiques">
        <div className="space-y-1">
          <InfoRow label="Alcool" value={venue.alcohol_policy ? ALCOHOL_POLICY_LABELS[venue.alcohol_policy] || venue.alcohol_policy : null} />
          <InfoRow label="Enfants" value={
            venue.children_welcome !== null ? (venue.children_welcome ? "Bienvenus" : "Non adapté") : null
          } />
          <InfoRow label="Accessible PMR" value={
            venue.accessible !== null ? (venue.accessible ? "Oui" : "Non") : null
          } />
        </div>
      </Section>

      {/* Testimonials */}
      {venue.testimonials && venue.testimonials.length > 0 && (
        <Section title="Témoignages d'organisateurs">
          <div className="space-y-4">
            {venue.testimonials.map((t, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <svg key={s} className={`w-4 h-4 ${s < t.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
                </div>
                <p className="text-sm text-gray-700 italic mb-2">&ldquo;{t.text}&rdquo;</p>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{t.author}</span>
                  <span className="text-gray-500"> &mdash; {t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contact & Quote request */}
      <Section title="Contact & demande de devis">
        <div className="space-y-1 mb-4">
          {venue.contact_email && (
            <InfoRow label="Email" value={
              <a href={`mailto:${venue.contact_email}`} className="text-blue-600 hover:underline">{venue.contact_email}</a>
            } />
          )}
          {venue.contact_phone && (
            <InfoRow label="Téléphone" value={venue.contact_phone} />
          )}
          {venue.website && (
            <InfoRow label="Site web" value={
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{venue.website}</a>
            } />
          )}
        </div>

        <QuoteRequestForm venueName={venue.name} venueEmail={venue.contact_email} bookingUrl={venue.booking_url} />
      </Section>

      {/* Source */}
      <div className="text-xs text-gray-400 mt-8 border-t pt-4">
        Source : {venue.source} | Dernière mise à jour : {new Date(venue.date_scraped).toLocaleDateString("fr-FR")}
        {venue.source_url && (
          <> | <a href={venue.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Voir l'original</a></>
        )}
      </div>
    </div>
  );
}

function QuoteRequestForm({ venueName, venueEmail, bookingUrl }: { venueName: string; venueEmail: string | null; bookingUrl: string | null }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    retreatType: "",
    groupSize: "",
    dates: "",
    duration: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construire le mailto avec les infos du formulaire
    const subject = encodeURIComponent(`Demande de devis — ${venueName}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite organiser une retraite dans votre lieu "${venueName}".\n\n` +
      `Nom : ${formData.name}\n` +
      `Email : ${formData.email}\n` +
      `Type de retraite : ${formData.retreatType}\n` +
      `Taille du groupe : ${formData.groupSize} personnes\n` +
      `Dates souhaitées : ${formData.dates}\n` +
      `Durée : ${formData.duration}\n\n` +
      `Message :\n${formData.message}\n\n` +
      `Cordialement,\n${formData.name}`
    );

    if (venueEmail) {
      window.open(`mailto:${venueEmail}?subject=${subject}&body=${body}`, "_self");
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
        <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        <p className="text-sm text-green-800 font-medium">Votre demande a été préparée</p>
        <p className="text-xs text-green-600 mt-1">Vérifiez votre messagerie email pour envoyer le message.</p>
        <button onClick={() => setSubmitted(false)} className="text-xs text-green-700 underline mt-2">Nouvelle demande</button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Demande de devis rapide</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Votre nom *"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <input
            type="email"
            placeholder="Votre email *"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Type de retraite (ex: Reiki)"
            value={formData.retreatType}
            onChange={(e) => setFormData({ ...formData, retreatType: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <input
            type="text"
            placeholder="Nb de participants"
            value={formData.groupSize}
            onChange={(e) => setFormData({ ...formData, groupSize: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <input
            type="text"
            placeholder="Durée (ex: 5 nuits)"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <input
          type="text"
          placeholder="Dates souhaitées (ex: Juin 2026)"
          value={formData.dates}
          onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
          className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        <textarea
          placeholder="Décrivez votre projet de retraite (besoins spécifiques, équipement, etc.)"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
        />
        <div className="flex gap-2">
          {venueEmail && (
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
            >
              Envoyer par email
            </button>
          )}
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Site de réservation
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
