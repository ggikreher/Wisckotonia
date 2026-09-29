# Wisckotonia

Besloten platform voor dispuut Wisckotonia. Leden loggen in om de galerij, de agenda en de documenten te bekijken. Beheerders maken accounts aan en onderhouden de inhoud.

## Starten

1. Zet PostgreSQL klaar:

```bash
docker compose up -d
```

2. Kopieer de omgevingsvariabelen en vul een eigen `AUTH_SECRET` in:

```bash
copy .env.example .env
```

3. Maak de database en de voorbeelddata aan:

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

De site staat daarna op [http://localhost:3000](http://localhost:3000). PostgreSQL draait via Docker op poort **5433**, zodat een andere database op de standaardpoort 5432 niet in de weg zit.

## Inloggen

De seed maakt twee accounts. Wijzig deze wachtwoorden zodra het platform echt in gebruik is.

| Rol | Gebruikersnaam | E-mail | Wachtwoord |
| --- | --- | --- | --- |
| Beheerder | `admin` | admin@wisckotonia.nl | `WisckoAdmin2026!` |
| Dispuutslid | `lid` | lid@wisckotonia.nl | `WisckoLid2026!` |

Een dispuutslid kan alles bekijken, documenten downloaden en eigen evenementen toevoegen. Een eigen evenement kan alleen de maker aanpassen of verwijderen. Een beheerder kan daarnaast accounts, leden en documenten beheren, en elk evenement wijzigen.

## Rollen

- `DISPUUT` — ingelogd lid.
- `ADMIN` — beheerder. Alleen deze rol mag `/admin` openen, leden en documenten wijzigen, en elk evenement aanpassen.

Niet-ingelogde bezoekers worden doorgestuurd naar `/login`. Die controle staat in `proxy.ts`. In Next.js 16 is dat de opvolger van `middleware.ts`. Elke wijziging controleert de rol daarnaast nog een keer op de server.

Inlogaccounts en de ledenkaartjes in de galerij zijn twee aparte dingen. Een account maak je onder Beheer; een kaartje onder Leden.

## Bestanden

Geüploade foto's en documenten komen in `uploads/` en worden alleen via een ingelogde route uitgeleverd, niet als openbaar bestand.
