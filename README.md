# XmasDev Conference — sito web

Sito web ufficiale di **XmasDev**, la conferenza tecnica di fine anno per la community degli sviluppatori italiani.  
Il sito è pubblicato su GitHub Pages all'indirizzo **[xmasdev.net](https://xmasdev.net)**.

---

## Indice

- [Descrizione del progetto](#descrizione-del-progetto)
- [Struttura del repository](#struttura-del-repository)
- [Prerequisiti](#prerequisiti)
- [Eseguire il sito in locale](#eseguire-il-sito-in-locale)
- [Flusso di sviluppo consigliato](#flusso-di-sviluppo-consigliato)
- [Modificare i contenuti](#modificare-i-contenuti)
- [Stile (CSS)](#stile-css)
- [JavaScript](#javascript)
- [Deploy su GitHub Pages](#deploy-su-github-pages)
- [Contribuire](#contribuire)

---

## Descrizione del progetto

XmasDev è una conferenza di una giornata dedicata a talk tecnici, workshop pratici e networking tra sviluppatori.
Viene organizzata ogni anno a dicembre a Roma.

Il sito è un'applicazione **statica pura** (HTML + CSS + JavaScript vanilla), senza framework, senza bundler e senza step di build.
Tutte le pagine caricano dati dinamici (agenda, staff, sponsor) da file JSON nella cartella `data/` tramite `fetch()`.
L'agenda della conferenza attiva viene recuperata dall'API di [Sessionize](https://sessionize.com).

---

## Struttura del repository

```
xmasdev-conf.github.io/
├── index.html                  # Homepage
├── agenda.html                 # Pagina agenda
├── staff.html                  # Pagina staff
├── sponsors.html               # Pagina sponsor
├── edizioni-precedenti.html    # Archivio edizioni passate
│
├── css/
│   └── style.css               # Foglio di stile unico
│
├── js/
│   ├── main.js                 # Script condiviso (navbar, fiocchi di neve, CFP banner)
│   ├── agenda.js               # Fetch e rendering dell'agenda da Sessionize
│   ├── staff.js                # Fetch e rendering delle card staff
│   ├── sponsors.js             # Fetch e rendering delle card sponsor
│   └── editions.js             # Rendering dell'archivio edizioni precedenti
│
├── data/
│   ├── editions.json           # Indice delle edizioni (edizione attiva + link ai config)
│   └── editions/
│       ├── 2026.json           # Config edizione 2026 (agenda, CFP, sponsor, staff)
│       └── 2025.json           # Config edizione 2025
│
└── assets/
    ├── sponsors/               # Logo degli sponsor (PNG/SVG)
    └── staff/                  # Foto dei membri dello staff (PNG)
```

### File di dati principali

| File | Contenuto |
|---|---|
| `data/editions.json` | Indice di tutte le edizioni; imposta `activeEdition` per indicare quella corrente |
| `data/editions/<anno>.json` | Config per singola edizione: agenda (URL Sessionize), CFP, sponsor e staff |

---

## Prerequisiti

Non è necessario installare nulla di speciale.  
Per visualizzare il sito in locale è sufficiente uno dei seguenti strumenti:

- **[Python](https://www.python.org/)** ≥ 3.x (incluso di default nella maggior parte dei sistemi)
- **[Node.js](https://nodejs.org/)** (opzionale, per `npx serve` o `http-server`)
- Qualsiasi altro server HTTP statico locale

> ⚠️ Aprire `index.html` direttamente con il browser (protocollo `file://`) non funziona correttamente perché le chiamate `fetch()` ai file JSON vengono bloccate dal browser per ragioni di sicurezza (CORS). È necessario utilizzare un server HTTP.

---

## Eseguire il sito in locale

1. Clona il repository:

   ```bash
   git clone https://github.com/xmasdev-conf/xmasdev-conf.github.io.git
   cd xmasdev-conf.github.io
   ```

2. Avvia un server HTTP locale nella cartella del progetto:

   ```bash
   # Con Python 3
   python3 -m http.server 8080

   # Oppure con Node.js (npx, non richiede installazione)
   npx serve .

   # Oppure con http-server
   npx http-server . -p 8080
   ```

3. Apri il browser su **[http://localhost:8080](http://localhost:8080)**.

---

## Flusso di sviluppo consigliato

1. Crea un branch a partire da `main`:

   ```bash
   git checkout -b feat/nome-della-modifica
   ```

2. Esegui il server locale (vedi sopra) e lavora sulle modifiche.

3. Verifica il risultato nel browser; le pagine non richiedono ricompilazione.

4. Fai commit dei tuoi cambiamenti con un messaggio descrittivo:

   ```bash
   git add .
   git commit -m "feat: descrizione sintetica della modifica"
   ```

5. Apri una Pull Request verso `main` sul repository GitHub.

---

## Modificare i contenuti

### Testi e struttura delle pagine

I contenuti statici (titoli, descrizioni, sezioni) si trovano direttamente nei file HTML (`index.html`, `agenda.html`, ecc.). Modifica il file HTML corrispondente alla pagina che vuoi aggiornare.

### Dati di un'edizione (agenda, staff, sponsor, CFP)

Tutti i dati di un'edizione si trovano in `data/editions/<anno>.json`.

**Struttura del file di configurazione per un'edizione:**

```jsonc
{
  "agenda": {
    "enabled": true,               // true mostra l'agenda, false mostra "disponibile presto"
    "sessionizeApiUrl": "https://sessionize.com/api/v2/<EVENT_ID>/view/All",
    "subtitle": "Testo introduttivo mostrato nella pagina agenda"
  },
  "cfp": {
    "enabled": true,               // true mostra il banner CFP se la deadline non è scaduta
    "title": "Call for Papers XmasDev <anno>",
    "close": "2026-09-30T23:59:59+02:00",  // Data di chiusura ISO 8601
    "link": "https://sessionize.com/xmasdev-<anno>/"
  },
  "sponsors": {
    "tiers": [
      {
        "name": "Diamond",         // Livello: Diamond, Platinum, Gold, Silver
        "sponsors": [
          {
            "name": "Nome Sponsor",
            "logo": "assets/sponsors/nome-sponsor.svg",
            "url": "https://example.com",
            "description": "Descrizione breve"
          }
        ]
      }
    ]
  },
  "staff": [
    {
      "id": 1,
      "firstName": "Nome",
      "lastName": "Cognome",
      "role": "Co-organizer",
      "photo": "assets/staff/nome-cognome.png",
      "socials": {
        "linkedin": "https://linkedin.com/in/username",
        "x": "https://x.com/username",
        "bluesky": "https://bsky.app/profile/username"
      }
    }
  ]
}
```

### Aggiungere una nuova edizione

1. Crea il file `data/editions/<anno>.json` seguendo la struttura sopra.
2. Aggiorna `data/editions.json` aggiungendo la nuova edizione nell'oggetto `editions` e impostando `activeEdition` al nuovo anno:

   ```json
   {
     "activeEdition": "2027",
     "editions": {
       "2027": {
         "name": "XmasDev 2027",
         "eventDate": "2027-12-10",
         "city": "Roma, Italia",
         "configUrl": "data/editions/2027.json"
       }
     }
   }
   ```

### Collegare l'agenda a Sessionize

Dopo la pubblicazione dell'agenda sull'evento Sessionize, aggiorna `sessionizeApiUrl` nel file `data/editions/<anno>.json`:

```json
"sessionizeApiUrl": "https://sessionize.com/api/v2/<EVENT_ID>/view/All"
```

Sostituisci `<EVENT_ID>` con l'ID del tuo evento Sessionize (visibile nell'URL della dashboard di Sessionize).

---

## Stile (CSS)

Tutti gli stili si trovano in un unico file: **`css/style.css`**.

Il file usa variabili CSS custom (definite in `:root`) per gestire i colori e i valori di spaziatura/raggio del tema. I principali token sono:

| Variabile | Descrizione |
|---|---|
| `--color-primary` | Colore primario (rosso natalizio) |
| `--color-bg` | Sfondo principale |
| `--color-surface` | Sfondo delle card |
| `--color-text` | Colore del testo principale |
| `--color-border` | Colore dei bordi |
| `--radius-md` / `--radius-lg` | Raggi degli angoli |

Per modificare il tema basta aggiornare i valori nel blocco `:root` in cima al file.

---

## JavaScript

Il JavaScript è suddiviso in file separati per funzionalità:

| File | Responsabilità |
|---|---|
| `js/main.js` | Navbar responsive (hamburger), fiocchi di neve animati, evidenziazione pagina corrente, banner CFP |
| `js/agenda.js` | Fetch dei dati da Sessionize, rendering griglia/lista sessioni con tab per track |
| `js/staff.js` | Fetch e rendering delle card staff con ordine randomizzato |
| `js/sponsors.js` | Fetch e rendering delle card sponsor suddivise per tier |
| `js/editions.js` | Rendering dell'archivio delle edizioni precedenti |

Ogni file è autonomo e non dipende da librerie esterne o da altri file JS del progetto.  
`main.js` è incluso in tutte le pagine; gli altri script sono inclusi solo nelle pagine che li utilizzano.

---

## Deploy su GitHub Pages

Il sito viene pubblicato automaticamente su GitHub Pages direttamente dal branch `main`.  
Non è previsto alcun step di build: GitHub Pages serve i file statici così come sono.

**Per aggiornare il sito è sufficiente fare push su `main`** (direttamente o tramite merge di una Pull Request). Le modifiche sono visibili all'indirizzo [xmasdev.net](https://xmasdev.net) nel giro di pochi minuti.

---

## Contribuire

Consulta il file **[CONTRIBUTING.md](CONTRIBUTING.md)** per le linee guida su come aprire issue, proporre modifiche e inviare Pull Request.

---

*Made with ❤️ by the XmasDev community*
