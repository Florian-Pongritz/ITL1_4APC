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
