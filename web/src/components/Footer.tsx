import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Layout : branding à gauche, colonnes de liens groupées à droite */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-10 sm:gap-16">
          {/* Branding */}
          <div className="sm:max-w-xs shrink-0">
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/logo_alt_living.png"
                alt="Cohabitat Europe"
                width={100}
                height={33}
              />
            </Link>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Trouvez votre habitat group&eacute; en Europe. Annonces
              &eacute;valu&eacute;es par IA, profils communautaires et outils
              de recherche personnalis&eacute;s.
            </p>
          </div>

          {/* Colonnes de liens groupées */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10">
            {/* Explorer */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-3">
                Explorer
              </h3>
              <ul className="space-y-2">
                <FooterLink href="/habitats">Habitats group&eacute;s</FooterLink>
                <FooterLink href="/appartements">Appartements</FooterLink>
                <FooterLink href="/retraites">Retraites</FooterLink>
                <FooterLink href="/profils">Profils</FooterLink>
              </ul>
            </div>

            {/* Participer */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-3">
                Participer
              </h3>
              <ul className="space-y-2">
                <FooterLink href="/questionnaire">Chercher un lieu</FooterLink>
                <FooterLink href="/profils/creer">
                  Cr&eacute;er mon profil
                </FooterLink>
                <FooterLink href="/creer">Proposer un projet</FooterLink>
                <FooterLink href="/favoris">Mes favoris</FooterLink>
              </ul>
            </div>

            {/* Infos */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-3">
                Informations
              </h3>
              <ul className="space-y-2">
                <FooterLink href="/mentions-legales">
                  Mentions l&eacute;gales
                </FooterLink>
                <FooterLink href="/cgu">
                  Conditions d&apos;utilisation
                </FooterLink>
                <FooterLink href="/parametres">
                  Param&egrave;tres
                </FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* Séparateur + bas de page */}
        <div className="mt-10 pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted-light)]">
            &copy; {new Date().getFullYear()} Cohabitat Europe &mdash; Projet
            &agrave; but non lucratif
          </p>
          <p className="text-xs text-[var(--muted-light)]">
            Fait avec{" "}
            <span aria-label="amour" role="img">
              &#9829;
            </span>{" "}
            pour l&apos;habitat partag&eacute;
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
