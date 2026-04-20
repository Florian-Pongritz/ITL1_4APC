# Dokumentation: Login & Registrierung – Full Stack (Backend + Ionic Frontend)

## Übersicht – Ablauf

1. Benutzer gibt Login-/Registrierungsdaten im Ionic-Frontend ein
2. Daten werden per HTTP-POST an das Express-Backend gesendet
3. Backend prüft die Daten (existiert User? Passwort korrekt?)
4. Bei Erfolg: JWT-Token wird erzeugt und an den Client zurückgegeben
5. Client speichert den Token im `localStorage` und navigiert zur Home-Seite
6. Home-Seite zeigt die Benutzerdaten an (Name, E-Mail, Typ, Telefon)

---

# BACKEND

## 1. Datenbank (Sequelize / MySQL)

Die Datenbank wird über **Sequelize ORM** verwaltet. Als Datenbank-Dialekt kommt **MySQL** zum Einsatz. Die Verbindungsdaten stehen in `backend/config/config.json`:

```json
{
  "development": {
    "username": "root",
    "password": "...",
    "database": "ITL1_development",
    "host": "db",
    "dialect": "mysql"
  }
}
```

### 1.1 User-Model (`backend/models/user.js`)

Das User-Model definiert alle Felder, die ein Benutzer besitzt:

```js
User.init({
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  name: DataTypes.STRING,
  phone: DataTypes.STRING,
  type: DataTypes.STRING,
  stripeId: DataTypes.STRING
}, {
  sequelize,
  modelName: 'User',
});
```

| Feld        | Typ    | Beschreibung                                      |
|-------------|--------|---------------------------------------------------|
| id          | INT    | Primärschlüssel, auto-increment                   |
| firstName   | STRING | Vorname                                           |
| lastName    | STRING | Nachname                                          |
| email       | STRING | E-Mail-Adresse (wird als Username verwendet)      |
| password    | STRING | Gehashtes Passwort (bcrypt)                       |
| name        | STRING | Anzeigename (Vor- + Nachname zusammengesetzt)     |
| phone       | STRING | Telefonnummer                                     |
| type        | STRING | Benutzertyp (z.B. `"client"`)                     |
| stripeId    | STRING | Stripe-Payment-ID                                 |
| createdAt   | DATE   | Erstellungszeitpunkt (automatisch von Sequelize)  |
| updatedAt   | DATE   | Letztes Update (automatisch von Sequelize)        |

### 1.2 Migrationen

Die Tabelle wurde schrittweise über drei Migrationen aufgebaut:

1. **`20260302140333-create-user.js`** – Erstellt die Tabelle `Users` mit `id`, `firstName`, `lastName`, `email`, `createdAt`, `updatedAt`
2. **`20260309000000-add-auth-fields-to-user.js`** – Fügt die Spalten `password`, `name`, `phone`, `type` hinzu
3. **`20260316000000-add-stripeid-to-user.js`** – Fügt die Spalte `stripeId` hinzu

### 1.3 Model-Loader (`backend/models/index.js`)

Die Datei `models/index.js` liest automatisch alle Model-Dateien im Ordner ein und registriert sie bei Sequelize:

```js
fs.readdirSync(__dirname)
  .filter(file => file.slice(-3) === '.js' && file !== basename)
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });
```

Dadurch stehen alle Models über das `db`-Objekt zur Verfügung (z.B. `db.User`).

---

## 2. Listener-Dienst (Express-Server) – `backend/index.js`

```js
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const loginRouter = require('./routes/login');

const app = express();

app.use(cors());            // Cross-Origin-Requests erlauben
app.use(express.json());    // JSON-Body-Parser aktivieren
app.use(passport.initialize()); // Passport Authentifizierung initialisieren

app.use('/clients', loginRouter); // Alle Routen unter /clients registrieren

app.listen(8100, () => {
  console.log('server started');
});
```

**Erklärung:**

| Zeile                            | Funktion                                                                 |
|----------------------------------|--------------------------------------------------------------------------|
| `app.use(cors())`               | Erlaubt Cross-Origin-Requests (nötig, da Frontend und Backend getrennt)  |
| `app.use(express.json())`       | Parsed den HTTP-Body als JSON, damit `req.body` verfügbar ist            |
| `app.use(passport.initialize())`| Initialisiert Passport.js für die Authentifizierung                      |
| `app.use('/clients', loginRouter)` | Bindet die Login/Register-Routen unter dem Pfad `/clients` ein        |
| `app.listen(8100)`              | Server lauscht auf Port 8100                                             |

---

## 3. Routen: `/register` und `/login` – `backend/routes/login.js`

### 3.1 Passport-Strategien

Bevor die Routen definiert werden, werden zwei Passport-Strategien konfiguriert:

**LocalStrategy (`clientLocal`)** – Prüft E-Mail und Passwort bei Login:

```js
passport.use(
  'clientLocal',
  new LocalStrategy((username, password, done) => {
    User.findOne({ where: { email: username }, raw: false })
      .then((user) => {
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
  })
);
```

- Sucht den User anhand der E-Mail in der Datenbank
- Vergleicht das eingegebene Passwort mit dem gespeicherten bcrypt-Hash
- Bei Erfolg wird der User an Passport übergeben

**JwtStrategy (`clientJwt`)** – Prüft den JWT-Token bei geschützten Routen:

```js
passport.use(
  'clientJwt',
  new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
  }, (payload, done) => {
    User.findByPk(payload.id)
      .then((user) => {
        if (user) return done(null, user);
        return done(null, false);
      });
  })
);
```

- Extrahiert den JWT-Token aus dem `Authorization: Bearer <token>` Header
- Dekodiert den Token und sucht den User anhand der `id` im Token-Payload

### 3.2 Route: POST `/clients/register`

```js
router.post('/register', (req, res) => {
  if (req.body.username && req.body.password) {
    User.findOne({ where: { email: req.body.username }, raw: false })
      .then((user) => {
        if (user) {
          res.status(401).json({ message: 'Username already exists' });
        } else {
          const hash = bcrypt.hashSync(req.body.password, saltRounds);
          User.create({
            email: req.body.username,
            password: hash,
            name: req.body.name,
            phone: req.body.phone,
            type: 'client',
            stripeId: req.body.stripeId,
          })
          .then((userNew) => {
            const payload = { id: userNew.id };
            const token = jwt.sign(payload, jwtSecret);
            res.json({ token });
          });
        }
      });
  }
});
```

**Ablauf:**

1. Prüft, ob `username` und `password` im Request-Body vorhanden sind
2. Sucht in der DB, ob die E-Mail bereits existiert → falls ja: Fehler `401`
3. Hasht das Passwort mit `bcrypt` (10 Salt-Runden)
4. Erstellt einen neuen User-Datensatz in der DB
5. Erzeugt einen **JWT-Token** mit der User-ID als Payload
6. Sendet den Token als JSON-Response zurück: `{ "token": "eyJhbG..." }`

### 3.3 Route: POST `/clients/login`

```js
router.post('/login', (req, res, done) => {
  passport.authenticate('clientLocal', (err, user, info) => {
    if (!user) {
      return res.status(401).json({ success: false, info });
    }
    req.login(user, { session: false }, () => {
      const payload = { id: req.user.id };
      const token = jwt.sign(payload, jwtSecret);
      return res.json({ token });
    });
  })(req, res, done);
});
```

**Ablauf:**

1. Passport führt die `clientLocal`-Strategie aus (E-Mail + Passwort prüfen)
2. Falls kein User gefunden oder Passwort falsch → Fehler `401` mit Info-Nachricht
3. Bei Erfolg: `req.login()` wird aufgerufen (sessionless, da `session: false`)
4. JWT-Token wird mit der User-ID erzeugt und als JSON zurückgegeben: `{ "token": "eyJhbG..." }`

### 3.4 Route: GET `/clients/user` (geschützt)

```js
router.get('/user',
  passport.authenticate('clientJwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);
```

- Geschützt durch die `clientJwt`-Strategie
- Gibt die vollständigen User-Daten als JSON zurück
- Der Token muss im `Authorization`-Header mitgesendet werden

---

# FRONTEND (Ionic / Angular)

## 4. Register Page

### 4.1 Source Code – `register.page.ts`

```typescript
export class RegisterPage {
  userForm = new FormGroup({
    'first_name': new FormControl('', [Validators.required]),
    'last_name': new FormControl('', [Validators.required]),
    'phone': new FormControl('', [Validators.required]),
    'email': new FormControl('', [Validators.required]),
    'password': new FormControl('', [Validators.required])
  });

  spinner = false;
  disabled = false;

  constructor(
    private api: ApiService,
    private userProvider: UserService,
    private util: UtilService,
    private push: PushService
  ) {}

  async registerUser() {
    if (!this.userForm.valid) {
      this.getFormValidationErrors();
      return;
    }
    this.setSpinner();
    this.api.signUp(this.userForm.value)
      .then(res => {
        this.userProvider.setToken(res['token']);
        this.api.getUser().subscribe((user: any) => {
          this.push.saveToken();
          this.userProvider.setLoggedInUser(user);
          this.clearSpinner();
          this.util.goToNew('/home');
        });
      }).catch(async err => {
        const toast = await this.util.createToast(err.error?.message || err.statusText, false, 'top');
        await toast.present();
        this.clearSpinner();
      });
  }
}
```

**Erklärung:**

- Das Formular wird als **Reactive Form** (`FormGroup`) mit 5 Feldern angelegt
- Jedes Feld hat den Validator `Validators.required` → Pflichtfeld
- `registerUser()` prüft die Validierung, ruft `api.signUp()` auf
- Bei Erfolg: Token wird gespeichert, User-Daten geladen, Navigation zu `/home`
- Bei Fehler: Toast-Nachricht wird angezeigt

### 4.2 Frontend-Darstellung – `register.page.html`

```html
<form [formGroup]="userForm" (ngSubmit)="registerUser()">
  <ion-grid padding-top>
    <ion-row>
      <ion-col size="6">
        <ion-item>
          <ion-label position="stacked">FIRST NAME</ion-label>
          <ion-input type="text" formControlName="first_name"></ion-input>
        </ion-item>
      </ion-col>
      <ion-col size="6">
        <ion-item>
          <ion-label position="stacked">LAST NAME</ion-label>
          <ion-input type="text" formControlName="last_name"></ion-input>
        </ion-item>
      </ion-col>
    </ion-row>
    <!-- ... weitere Felder: email, phone, password ... -->
  </ion-grid>

  <ion-button expand="full" type="submit" [disabled]="disabled">
    Next
    <span *ngIf="spinner"><ion-spinner name="lines"></ion-spinner></span>
  </ion-button>
</form>
```

**Wie wird das Formular erzeugt?**

- Das HTML-`<form>`-Element wird mit `[formGroup]="userForm"` an das `FormGroup`-Objekt im TypeScript gebunden
- Jedes `<ion-input>` wird über `formControlName="..."` mit dem entsprechenden `FormControl` verknüpft
- Die Validierung passiert automatisch durch Angular Reactive Forms

**Wie wird die Button-Funktion zugewiesen?**

- Der Submit-Button hat `type="submit"` → beim Klick wird das `(ngSubmit)`-Event des `<form>`-Tags ausgelöst
- `(ngSubmit)="registerUser()"` ruft die Methode `registerUser()` in der Komponente auf
- `[disabled]="disabled"` deaktiviert den Button während der Server-Anfrage (Spinner läuft)

---

## 5. Login Page

### 5.1 Source Code – `login.page.ts`

```typescript
export class LoginPage {
  user: any = { email: '', password: '' };
  spinner = false;
  disabled = false;

  constructor(
    private api: ApiService,
    private userProvider: UserService,
    private util: UtilService,
    private push: PushService
  ) {}

  login() {
    this.setSpinner();
    this.api.logIn(this.user.email, this.user.password)
      .subscribe(
        (res: any) => {
          this.userProvider.setToken(res['token']);
          this.api.getUser().subscribe((responseUser: any) => {
            this.push.saveToken();
            this.userProvider.setLoggedInUser(responseUser);
            this.clearSpinner();
            this.util.goToNew('/home');
          });
        },
        async (err: any) => {
          const toast = await this.util.createToast(
            err.error?.info?.message || 'Login failed', false, 'top'
          );
          await toast.present();
          this.clearSpinner();
        }
      );
  }
}
```

**Erklärung:**

- Die Login-Daten werden als einfaches Objekt `user: { email, password }` gehalten (kein Reactive Form, stattdessen `ngModel`)
- `login()` ruft `api.logIn()` auf → gibt ein Observable zurück
- Bei Erfolg: Token speichern → User-Daten holen → zur Home-Seite navigieren
- Bei Fehler: Fehlermeldung als Toast anzeigen

### 5.2 Frontend-Darstellung – `login.page.html`

```html
<ion-content class="ion-padding">
  <ion-grid padding-top>
    <ion-row>
      <ion-col size="12">
        <ion-item>
          <ion-label position="stacked">EMAIL</ion-label>
          <ion-input type="email" [(ngModel)]="user.email"></ion-input>
        </ion-item>
      </ion-col>
    </ion-row>
    <ion-row>
      <ion-col size="12">
        <ion-item>
          <ion-label position="stacked">PASSWORD</ion-label>
          <ion-input type="password" [(ngModel)]="user.password"></ion-input>
        </ion-item>
      </ion-col>
    </ion-row>
  </ion-grid>

  <ion-button expand="full" (click)="login()" [disabled]="disabled">
    Log In
    <span *ngIf="spinner"><ion-spinner name="lines"></ion-spinner></span>
  </ion-button>

  <ion-button expand="full" fill="clear" routerLink="/register">
    Don't have an account? Register
  </ion-button>
</ion-content>
```

**Wie wird die Button-Funktion zugewiesen?**

- Hier wird **kein `<form>` + `ngSubmit`** verwendet, sondern direkt ein `(click)`-Event auf dem Button:
  `(click)="login()"` → ruft die `login()`-Methode auf
- `[disabled]="disabled"` verhindert Doppelklicks während die Anfrage läuft

**Unterschied zu Register:**

| Aspekt                | Login Page            | Register Page            |
|-----------------------|-----------------------|--------------------------|
| Datenbindung          | `[(ngModel)]` (Two-Way Binding) | `formControlName` (Reactive Form) |
| Formular-Submit       | `(click)="login()"` auf Button | `(ngSubmit)="registerUser()"` auf `<form>` |
| Validierung           | Keine client-seitige  | `Validators.required` auf jedem Feld |

---

## 6. API-Service (`api.service.ts`)

Der `ApiService` kapselt alle HTTP-Anfragen an das Backend:

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private url = environment.apiUrl;  // z.B. 'http://localhost:8100'

  constructor(private http: HttpClient, private userService: UserService) {}
```

### 6.1 Funktion `signUp(user)` – Registrierung

```typescript
async signUp(user: any) {
  const userInfo = {
    'username': user['email'],
    'email': user['email'],
    'name': `${user['first_name']} ${user['last_name']}`,
    'phone': user['phone'],
    'password': user['password'],
    'type': 'client',
    'stripeId': user['stripeId']
  };
  return this.http.post(`${this.url}/clients/register`, userInfo).toPromise();
}
```

**Erklärung:**

- Nimmt die Formulardaten entgegen und mapped sie auf das vom Backend erwartete Format
- `first_name` + `last_name` werden zu `name` zusammengesetzt
- `email` wird auch als `username` übermittelt (Backend erwartet `username`)
- Sendet POST an `/clients/register`
- Gibt ein **Promise** zurück (`.toPromise()`) → wird mit `await`/`.then()` aufgerufen
- Antwort: `{ token: "..." }`

### 6.2 Funktion `logIn(username, password)` – Login

```typescript
logIn(username: string, password: string): Observable<any> {
  return this.http.post(`${this.url}/clients/login`, { username, password });
}
```

**Erklärung:**

- Sendet POST an `/clients/login` mit `{ username, password }` als JSON-Body
- Gibt ein **Observable** zurück → wird mit `.subscribe()` aufgerufen
- Antwort: `{ token: "..." }`

### 6.3 Funktion `getUser()` – Benutzerdaten abrufen

```typescript
getUser(): Observable<any> {
  const token = this.userService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get(`${this.url}/clients/user`, { headers });
}
```

**Erklärung:**

- Liest den gespeicherten JWT-Token aus dem `UserService`
- Setzt den Token in den HTTP-Header: `Authorization: Bearer eyJhbG...`
- Sendet GET an `/clients/user` → Backend gibt die User-Daten zurück

---

## 7. Token-Übertragung und -Speicherung

### Ablaufdiagramm

```
[Client: Login/Register]
        |
        | POST /clients/login  { username, password }
        v
[Backend: Passport prüft Credentials]
        |
        | Erfolg → jwt.sign({ id: user.id }, secret)
        v
[Backend → Client]  { token: "eyJhbG..." }
        |
        | userService.setToken(token)  →  localStorage.setItem('token', token)
        v
[Client: getUser()]
        | GET /clients/user  +  Header: Authorization: Bearer eyJhbG...
        v
[Backend: Passport JWT-Strategie prüft Token]
        | → User aus DB laden
        v
[Backend → Client]  { id, email, name, phone, type, ... }
        |
        | userService.setLoggedInUser(user)  →  localStorage.setItem('user', JSON.stringify(user))
        v
[Client: Navigation zu /home → User-Daten anzeigen]
```

### Wo wird der Token gespeichert? – `user.service.ts`

```typescript
setToken(token: string) {
  this.token = token;
  localStorage.setItem('token', token);   // persistent im Browser
}

getToken(): string | null {
  return this.token || localStorage.getItem('token');  // aus Memory oder Storage
}
```

Der Token wird sowohl in einer Klassenvariable (für schnellen Zugriff) als auch im `localStorage` des Browsers (persistiert über Seitenreloads) gespeichert.

---

## 8. Home-Seite – Anzeige der Benutzerdaten

### 8.1 Source Code – `home.page.ts`

```typescript
export class HomePage implements OnInit {
  user: any;

  constructor(private userService: UserService, private util: UtilService) {}

  ngOnInit() {
    this.user = this.userService.getLoggedInUser();
  }

  logout() {
    this.userService.logout();
    this.util.goToNew('/login');
  }
}
```

### 8.2 Frontend-Darstellung – `home.page.html`

```html
<ion-header>
  <ion-toolbar>
    <ion-title>Home</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="logout()">Logout</ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <ion-card>
    <ion-card-header>
      <ion-card-title>Welcome, {{ user?.name }}</ion-card-title>
      <ion-card-subtitle>{{ user?.email }}</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <p>You are logged in as <strong>{{ user?.type }}</strong>.</p>
      <p *ngIf="user?.phone">Phone: {{ user?.phone }}</p>
    </ion-card-content>
  </ion-card>
</ion-content>
```

Die Benutzerdaten werden über **Angular Interpolation** (`{{ }}`) direkt im Template ausgegeben. Der `?`-Operator (Optional Chaining) verhindert Fehler, falls `user` noch `null` ist.

---

## 9. Route Guard – `auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (userService.isLoggedIn()) {
    return true;
  }
  router.navigateByUrl('/login');
  return false;
};
```

Die Home-Seite ist durch den `authGuard` geschützt. Nur wenn ein Token vorhanden ist (`isLoggedIn()` prüft ob ein Token im `localStorage` existiert), darf auf `/home` zugegriffen werden. Andernfalls wird automatisch auf `/login` umgeleitet.

**Routing-Konfiguration** (`app-routing.module.ts`):

```typescript
{
  path: 'home',
  loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
  canActivate: [authGuard]  // ← Guard schützt diese Route
},
```
