# Roadmap — Plateforme de lieux de retraite

> Ce document liste toutes les features et améliorations identifiées pour faire de la plateforme LA référence pour les organisateurs de retraites.

---

## Phase 1 — Indispensable (court terme)

### 1.1 Vue carte interactive (Leaflet)
- Afficher tous les lieux sur une carte avec clusters
- Clic sur un marqueur = popup avec résumé du lieu
- Synchronisation carte ↔ liste (filtrer la carte quand on filtre la liste)
- Mode split (liste à gauche, carte à droite) — déjà prévu dans RetreatDashboard

### 1.2 Comparateur visuel côte-à-côte
- L'infra de sélection existe (compareIds dans RetreatDashboard)
- Créer une vue tableau comparatif (jusqu'à 4 lieux)
- Colonnes : prix, capacité, espaces de pratique, repas, services, score, etc.
- Export PDF du comparatif

### 1.3 Calculateur de budget
- L'organisateur entre : nb de personnes, nb de nuits, formule repas souhaitée
- Estimation automatique : lieu + repas + extras (taxe de séjour, ménage, caution)
- Afficher le prix par personne et le total

### 1.4 Demande de devis multi-lieux
- Sélectionner 2-5 lieux depuis la liste
- Remplir UN seul formulaire (dates, nb participants, type de retraite)
- Envoyer la même demande aux 5 lieux en un clic
- Suivi des réponses (reçu / en attente / relancer)

---

## Phase 2 — Croissance (moyen terme)

### 2.1 Comptes utilisateur organisateur
- Inscription / connexion (email + magic link ou Google)
- Wishlist sauvegardée côté serveur (remplace le localStorage)
- Notes personnelles par lieu
- Historique des demandes de devis
- Alertes : "Prévenez-moi quand un nouveau lieu correspondant à mes critères est ajouté"

### 2.2 Système d'avis vérifiés
- Après une retraite, l'organisateur peut laisser un avis
- Notation multicritère : qualité lieu, rapport qualité-prix, communication, restauration, propreté
- Modération avant publication
- Badge "Avis vérifié" vs témoignages fournis par le lieu

### 2.3 Calendrier de disponibilité
- Chaque lieu peut indiquer ses périodes libres/occupées
- Affichage d'un calendrier simple (mois par mois, vert/rouge)
- Filtre : "Disponible en juin 2026"

### 2.4 Export PDF de la fiche lieu
- Bouton "Télécharger la fiche" sur la page détail
- PDF propre avec toutes les infos, photos, évaluation, tarifs
- Pour partager avec son équipe / co-organisateur

### 2.5 Pages collection SEO
- Pages auto-générées : "Les meilleurs lieux pour une retraite yoga en France"
- Par combinaison : type de retraite x pays x feature (piscine, eco, luxe...)
- Contenu éditorial + listing filtré
- Schema.org / structured data pour SEO

---

## Phase 3 — Différenciation (long terme)

### 3.1 Profil organisateur public
- Page publique avec bio, spécialités, retraites passées
- Portfolio avec photos des retraites organisées
- Liens vers les lieux utilisés (social proof pour le lieu)
- Peut être référencé par les lieux ("Organisateurs qui nous ont choisis")

### 3.2 Système de matching intelligent
- L'organisateur décrit son projet (type, taille, budget, dates, besoins)
- L'IA analyse et suggère les 3-5 meilleurs lieux avec explication
- Score de compatibilité personnalisé

### 3.3 Offres spéciales / last minute
- Les lieux peuvent publier des créneaux à remplir avec réduction
- Alerte aux organisateurs : "Lieu disponible en mars avec -20%"
- Système d'enchères inversées : l'organisateur publie son besoin, les lieux répondent

### 3.4 Badge "Vérifié par la plateforme"
- Visite physique du lieu par l'équipe
- Vérification des infos (capacité réelle, état des lieux, photos authentiques)
- Badge affiché sur la fiche + filtre "Lieux vérifiés uniquement"

### 3.5 Guides & contenu éditorial
- Articles : "Comment choisir son lieu de retraite", "Budget type pour une retraite yoga de 5 jours"
- Interviews d'organisateurs expérimentés
- Checklist téléchargeable pré-retraite (tout ce qu'il faut vérifier/préparer)
- FAQ par lieu (questions fréquentes + réponses du propriétaire)

### 3.6 Espace propriétaire de lieu
- Dashboard pour le propriétaire : modifier ses infos, photos, tarifs, disponibilités
- Voir les demandes de devis reçues
- Statistiques : vues, demandes, taux de conversion
- Plan gratuit (fiche basique) + plan premium (mise en avant, badge, analytics)

### 3.7 Programme de parrainage
- Un organisateur recommande la plateforme → crédit ou avantage
- Un lieu recommande un autre lieu → visibilité croisée

---

## Features techniques transverses

### Recherche par distance
- "Lieux à moins de 2h de Paris en train"
- "Lieux à moins de 30 min de l'aéroport"
- Utiliser lat/long + calcul de distance

### API publique
- API REST pour les lieux (lecture seule)
- Permettre l'intégration par des partenaires (agences, blogs)
- Webhook pour les nouveaux lieux ajoutés

### Mobile
- PWA responsive (déjà le cas)
- App native si la traction le justifie (React Native)

### Internationalisation
- Interface en FR + EN (les organisateurs internationaux)
- Fiches lieu traduites automatiquement
- Devise locale affichée selon la localisation de l'utilisateur

### Performance & scaling
- Migration des données JSON → base de données (Prisma/Supabase)
- Recherche full-text avec tsvector PostgreSQL ou Algolia
- CDN pour les images des lieux
- ISR pour les fiches lieu (déjà en place)
