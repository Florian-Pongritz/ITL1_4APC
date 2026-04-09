// Diese Mitschrift wurde mithilfe von AI geschrieben. Prompt: "Verschönere meine .md Mitschrift und ergänze Fehler und markiere sie mit (!AI überarbeitung)"

# Ionic & Cordova – Installation und Setup

## Was ist Ionic?
Ionic ist ein Open-Source-Framework zur Entwicklung von **hybriden mobilen Apps** (iOS, Android) und **Progressive Web Apps (PWA)** mit Web-Technologien wie HTML, CSS und TypeScript (Angular, React oder Vue).

## Was ist Cordova?
Apache Cordova ermöglicht es, Web-Apps als native mobile Apps zu verpacken. Ionic nutzt Cordova (oder Capacitor) als **Bridge** zwischen der Web-App und nativen Gerätefunktionen (Kamera, GPS, etc.).

---

## Installation via npm (lokal / ohne Docker)

### Voraussetzungen
- **Node.js** >= 22.x  → https://nodejs.org
- **npm** (wird mit Node.js mitgeliefert)

### Ionic CLI installieren
```sh
npm install -g @ionic/cli
```
- `-g` = global installieren (steht systemweit zur Verfügung)
- `@ionic/cli` = das offizielle Ionic Kommandozeilen-Tool

### Cordova installieren
```sh
npm install -g cordova
```
- Wird benötigt um native Plugins einzubinden und die App für iOS/Android zu bauen

### Zusatzpakete
```sh
npm install -g native-run cordova-res
```
| Paket | Zweck |
|---|---|
| `native-run` | Führt die App auf einem echten Gerät oder Emulator aus |
| `cordova-res` | Erzeugt App-Icons und Splash-Screens automatisch |

### Versionen prüfen
```sh
ionic --version
cordova --version
node --version
npm --version
```

---

## Neues Ionic-Projekt erstellen

```sh
ionic start meinProjekt tabs --type=angular
```

| Parameter | Bedeutung |
|---|---|
| `meinProjekt` | Name des Projekts (= Ordnername) |
| `tabs` | Template: `tabs`, `blank`, `sidemenu` |
| `--type=angular` | Framework: `angular`, `react`, `vue` |
| `--no-git` | Kein Git-Repository erstellen |

---

## Entwicklungsserver starten

```sh
cd meinProjekt
ionic serve
```

→ Öffnet die App im Browser unter `http://localhost:8100`

---

## Mit Docker (dieser Workspace)

Die `dockerFILE` und `docker-compose.yml` übernehmen die gesamte Installation automatisch.

### Pakete die global im Container installiert werden:
```dockerfile
RUN npm install -g @ionic/cli cordova native-run cordova-res
```

### Container starten:
```sh
docker-compose up --build
```

→ App erreichbar unter: `http://localhost:8100`

---

## Wichtige Ionic CLI Befehle

| Befehl | Beschreibung |
|---|---|
| `ionic serve` | Startet den lokalen Dev-Server |
| `ionic build` | Baut die App für Produktion |
| `ionic generate page Name` | Erstellt eine neue Seite |
| `ionic generate component Name` | Erstellt eine neue Komponente |
| `ionic cordova platform add android` | Fügt Android als Zielplattform hinzu |
| `ionic cordova run android` | Startet die App auf einem Android-Gerät |

---

# Sequelize & MySQL – Backend Setup

## Was ist Sequelize?
Sequelize ist ein **ORM (Object-Relational Mapper)** für Node.js. Es ermöglicht die Arbeit mit relationalen Datenbanken (MySQL, PostgreSQL, SQLite, etc.) über JavaScript-Objekte statt rohem SQL.

## Was ist Sequelize CLI?
Ein Kommandozeilen-Tool für Sequelize, das beim Erstellen von **Models**, **Migrationen**, **Seedern** und der Datenbank hilft.

---

## 1. Pakete installieren

Im Backend-Projektordner:
```sh
npm install sequelize sequelize-cli mysql2
```

| Paket | Zweck |
|---|---|
| `sequelize` | ORM – Datenbank-Operationen als JavaScript-Objekte |
| `sequelize-cli` | CLI-Tool für Migrationen, Models, Seeder |
| `mysql2` | MySQL-Treiber für Node.js |

## 2. Sequelize CLI initialisieren

```sh
npx sequelize-cli init
```

Erzeugt folgende Ordnerstruktur:
| Ordner | Zweck |
|---|---|
| `config/` | Datenbank-Konfiguration (config.json) |
| `models/` | Sequelize-Models (z.B. user.js) |
| `migrations/` | Datenbank-Migrationen (Tabellen erstellen/ändern) |
| `seeders/` | Testdaten in die DB einfügen |

## 3. Datenbank-Verbindung konfigurieren

Datei: `config/config.json`

```json
{
  "development": {
    "username": "root",
    "password": "DEIN_MYSQL_PASSWORT",
    "database": "taxi_development",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": "DEIN_MYSQL_PASSWORT",
    "database": "taxi_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": "DEIN_MYSQL_PASSWORT",
    "database": "taxi_production",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

→ Für die Entwicklung wird die `development`-Umgebung verwendet.

## 4. Datenbank erstellen

```sh
# Windows:
node_modules\.bin\sequelize db:create

# macOS / Linux:
node_modules/.bin/sequelize db:create
```

→ Erstellt die Datenbank `taxi_development` in MySQL.

## 5. User-Model generieren

```sh
npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string
```

Erstellt:
- `models/user.js` – das Sequelize-Model
- `migrations/XXXXXX-create-user.js` – die Migration

## 6. Migration ausführen (Tabelle erstellen)

```sh
# Windows:
node_modules\.bin\sequelize db:migrate

# macOS / Linux:
node_modules/.bin/sequelize db:migrate
```

Erstellt in der Datenbank:
- **Users** – die User-Tabelle mit firstName, lastName, email
- **SequelizeMeta** – Tracking welche Migrationen bereits ausgeführt wurden

## 7. Überprüfung

In MySQL Workbench oder CLI:
```sql
USE taxi_development;
SHOW TABLES;
```

Erwartete Tabellen:
- `Users`
- `SequelizeMeta`

---

## Wichtige Sequelize CLI Befehle

| Befehl | Beschreibung |
|---|---|
| `npx sequelize-cli init` | Projektstruktur initialisieren |
| `npx sequelize-cli db:create` | Datenbank erstellen |
| `npx sequelize-cli db:drop` | Datenbank löschen |
| `npx sequelize-cli model:generate` | Model + Migration generieren |
| `npx sequelize-cli db:migrate` | Alle offenen Migrationen ausführen |
| `npx sequelize-cli db:migrate:undo` | Letzte Migration rückgängig machen |
| `npx sequelize-cli seed:generate` | Neuen Seeder erstellen |
| `npx sequelize-cli db:seed:all` | Alle Seeder ausführen |

---

# Express Backend – Authentifizierung mit JWT & Passport

## Überblick

Das Backend läuft als **Express.js**-Server auf Port `8100` und bietet eine REST-API mit:
- **Registrierung** – neuen User anlegen
- **Login** – JWT-Token holen
- **Geschützter Endpunkt** – User-Daten nur mit gültigem Token abrufen

## Verwendete Pakete

```sh
npm install express cors passport passport-local passport-jwt bcrypt jsonwebtoken
```

| Paket | Zweck |
|---|---|
| `express` | Web-Framework für Node.js |
| `cors` | Erlaubt Anfragen von anderen Origins (z.B. Ionic-App) |
| `passport` | Authentifizierungs-Middleware |
| `passport-local` | Login mit Benutzername/Passwort |
| `passport-jwt` | Login-Prüfung via JWT-Token |
| `bcrypt` | Passwörter sicher hashen |
| `jsonwebtoken` | JWT erstellen und verifizieren |

## Projektstruktur

```
backend/
├── index.js          ← Server-Einstiegspunkt
├── routes/
│   └── login.js      ← Register, Login, geschützte Route
├── models/
│   └── user.js       ← Sequelize User-Model
└── config/
    └── config.json   ← DB-Verbindungsdaten
```

## index.js – Server starten

```js
const express = require('express');
const cors = require('cors');
const loginRouter = require('./routes/login');

const app = express();

app.use(cors());           // Cross-Origin Requests erlauben
app.use(express.json());   // JSON Body parsen

app.use('/login', loginRouter);

app.listen(8100, () => console.log('server started'));
```

## Passport Strategien

### Local Strategy (Login mit Passwort)
Prüft E-Mail + Passwort gegen die Datenbank:
```js
passport.use('clientLocal', new LocalStrategy((username, password, done) => {
  User.findOne({ where: { email: username } }).then(user => {
    if (!user) return done(null, false);
    if (!bcrypt.compareSync(password, user.password)) return done(null, false);
    return done(null, user);
  });
}));
```

### JWT Strategy (Token-Schutz)
Prüft ob der mitgelieferte Bearer-Token gültig ist:
```js
passport.use('clientJwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
}, (jwtPayload, done) => {
  User.findByPk(jwtPayload.id).then(user => {
    if (!user) return done(null, false);
    return done(null, user);
  });
}));
```

## API-Endpunkte

### POST /login/register
Neuen User anlegen, gibt direkt einen JWT zurück.

**Request:**
```json
{ "username": "test@mail.com", "password": "geheim" }
```
**Response:**
```json
{ "token": "eyJhbGci..." }
```

### POST /login/login
Einloggen mit bestehendem Account.

**Request:**
```json
{ "username": "test@mail.com", "password": "geheim" }
```
**Response:**
```json
{ "token": "eyJhbGci..." }
```

### GET /login/:id *(geschützt)*
User-Daten abrufen – nur mit gültigem JWT-Token.

**Header:**
```
Authorization: Bearer eyJhbGci...
```
**Response:**
```json
{ "id": 1, "email": "test@mail.com", "firstName": "Max" }
```
→ Passwort wird **nie** zurückgegeben (`exclude: ['password']`)

## Was ist JWT?

**JSON Web Token** – ein kompakter, selbst-signierter Token zur sicheren Authentifizierung.

```
Header.Payload.Signature
eyJhbGci....eyJpZCI6M....XXXXXXXXXXX
```

- Wird nach Login vom Server ausgestellt
- Client speichert ihn und schickt ihn bei jeder geschützten Anfrage mit
- Server prüft die Signatur – kein Datenbankzugriff nötig

## Passwort-Hashing mit bcrypt

Passwörter werden **niemals im Klartext** gespeichert:
```js
// Beim Registrieren – hashen:
const hash = bcrypt.hashSync(password, 10);  // 10 = Salt-Rounds

// Beim Login – vergleichen:
bcrypt.compareSync(eingabe, hashAusDB);  // true/false
```
