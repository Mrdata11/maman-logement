import { getApartmentById, getApartmentsWithEvals } from "@/lib/data";
import { APARTMENT_CRITERIA_LABELS, ApartmentCriteriaScores, PEB_RATING_COLORS } from "@/lib/types";
import { ScoreBar, ScoreBadge } from "@/components/ScoreBar";
import { ImageGallery } from "@/components/ImageGallery";
import { notFound } from "next/navigation";
import Link from "next/link";
import { haversineDistance, IXELLES_CENTER } from "@/lib/coordinates";

export function generateStaticParams() {
  const items = getApartmentsWithEvals();
  return items.map((item) => ({ id: item.listing.id }));
}

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getApartmentById(id);
  if (!item) return notFound();

  const { listing, evaluation } = item;

  // Calculate distance from Ixelles
  const distance =
    listing.latitude && listing.longitude
      ? Math.round(
          haversineDistance(IXELLES_CENTER, {
            lat: listing.latitude,
            lng: listing.longitude,
          }) * 10
        ) / 10
      : null;

  return (
    <div>
      <Link
        href="/appartements"
        className="text-[var(--primary)] hover:opacity-80 text-sm mb-4 inline-flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Retour aux appartements
      </Link>

      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-[var(--muted)] flex-wrap">
              {listing.commune && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  {listing.commune}
                  {listing.postal_code && ` (${listing.postal_code})`}
                </span>
              )}
              {listing.address && (
                <span className="text-xs">{listing.address}</span>
              )}
              {distance !== null && (
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-xs font-medium">
                  ~{distance} km d&apos;Ixelles
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
                {listing.source}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {evaluation && <ScoreBadge score={evaluation.overall_score} />}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {listing.price_monthly && (
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-600 mb-1">Loyer</div>
              <div className="text-lg font-bold text-blue-800">
                {listing.price_monthly.toLocaleString("fr-BE")} &euro;
              </div>
              {listing.charges_monthly && (
                <div className="text-xs text-blue-500">
                  + {listing.charges_monthly}&euro; charges
                </div>
              )}
            </div>
          )}
          {listing.bedrooms !== null && (
            <div className="bg-violet-50 rounded-lg p-3 text-center">
              <div className="text-xs text-violet-600 mb-1">Chambres</div>
              <div className="text-lg font-bold text-violet-800">
                {listing.bedrooms}
              </div>
            </div>
          )}
          {listing.bathrooms !== null && (
            <div className="bg-violet-50 rounded-lg p-3 text-center">
              <div className="text-xs text-violet-600 mb-1">SdB</div>
              <div className="text-lg font-bold text-violet-800">
                {listing.bathrooms}
              </div>
            </div>
          )}
          {listing.surface_m2 !== null && (
            <div className="bg-sky-50 rounded-lg p-3 text-center">
              <div className="text-xs text-sky-600 mb-1">Surface</div>
              <div className="text-lg font-bold text-sky-800">
                {listing.surface_m2} m&sup2;
              </div>
            </div>
          )}
          {listing.floor !== null && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">&Eacute;tage</div>
              <div className="text-lg font-bold text-gray-800">
                {listing.floor}
                {listing.total_floors ? `/${listing.total_floors}` : ""}
              </div>
            </div>
          )}
          {listing.peb_rating && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600 mb-1">PEB</div>
              <div className="mt-1">
                <span
                  className={`text-lg font-bold px-3 py-0.5 rounded ${
                    PEB_RATING_COLORS[listing.peb_rating] || ""
                  }`}
                >
                  {listing.peb_rating}
                </span>
              </div>
              {listing.peb_value && (
                <div className="text-xs text-gray-500 mt-1">
                  {listing.peb_value} kWh/m&sup2;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amenities grid */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            [listing.has_balcony, "Balcon"],
            [listing.has_terrace, "Terrasse"],
            [listing.has_garden, "Jardin"],
            [listing.has_parking, `Parking${listing.parking_count && listing.parking_count > 1 ? ` (${listing.parking_count})` : ""}`],
            [listing.has_elevator, "Ascenseur"],
            [listing.has_cellar, "Cave"],
            [listing.furnished, "Meubl\u00e9"],
            [listing.pets_allowed, "Animaux accept\u00e9s"],
          ]
            .filter(([val]) => val === true)
            .map(([, label]) => (
              <span
                key={label as string}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium"
              >
                {label as string}
              </span>
            ))}
          {[
            [listing.has_balcony === false, "Pas de balcon"],
            [listing.has_parking === false, "Pas de parking"],
            [listing.has_elevator === false, "Pas d'ascenseur"],
          ]
            .filter(([val]) => val === true)
            .map(([, label]) => (
              <span
                key={label as string}
                className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm"
              >
                {label as string}
              </span>
            ))}
        </div>

        {/* Images */}
        {listing.images.length > 0 && (
          <div className="mb-6">
            <ImageGallery images={listing.images} title={listing.title} />
          </div>
        )}

        {/* AI Evaluation */}
        {evaluation && (
          <div className="mb-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              &Eacute;valuation IA
            </h2>
            <p className="text-[var(--foreground)] mb-4">
              {evaluation.match_summary}
            </p>

            <div className="grid gap-2 mb-4">
              {(
                Object.entries(evaluation.criteria_scores) as [
                  keyof ApartmentCriteriaScores,
                  number,
                ][]
              ).map(([key, score]) => (
                <ScoreBar
                  key={key}
                  score={score}
                  max={10}
                  label={APARTMENT_CRITERIA_LABELS[key]}
                />
              ))}
            </div>

            {evaluation.highlights.length > 0 && (
              <div className="mb-2">
                <span className="text-sm font-medium text-green-700">
                  Points forts :
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {evaluation.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {evaluation.concerns.length > 0 && (
              <div>
                <span className="text-sm font-medium text-red-700">
                  Points d&apos;attention :
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {evaluation.concerns.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agency contact */}
        {(listing.agency_name || listing.agency_phone) && (
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="text-sm font-medium text-yellow-800">
              Agence :{" "}
            </span>
            {listing.agency_name && (
              <span className="text-sm text-yellow-900 font-semibold">
                {listing.agency_name}
              </span>
            )}
            {listing.agency_phone && (
              <span className="text-sm text-yellow-900 ml-2">
                ({listing.agency_phone})
              </span>
            )}
          </div>
        )}

        {/* Availability */}
        {listing.available_from && (
          <div className="mb-6 text-sm text-[var(--muted)]">
            Disponible &agrave; partir du :{" "}
            <span className="font-medium text-[var(--foreground)]">
              {new Date(listing.available_from).toLocaleDateString("fr-BE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Description
            </h2>
            <div className="prose prose-sm max-w-none text-[var(--foreground)] whitespace-pre-wrap">
              {listing.description}
            </div>
          </div>
        )}

        {/* Source link */}
        <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center gap-3">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] text-sm font-medium transition-colors"
          >
            Voir sur Immoweb
          </a>
          <span className="text-xs text-[var(--muted-light)]">
            ID: {listing.id} | Scrap&eacute;:{" "}
            {new Date(listing.date_scraped).toLocaleDateString("fr-BE")}
          </span>
        </div>
      </div>
    </div>
  );
}
