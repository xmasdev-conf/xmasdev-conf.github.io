# Linee guida per i contributor

Grazie per l'interesse nel contribuire al sito di **XmasDev**! 🎄  
Questo documento descrive come proporre modifiche, segnalare problemi e inviare Pull Request.

---

## Come contribuire

### 1. Segnalare un problema o proporre una funzionalità

Apri una **Issue** su GitHub descrivendo:

- il problema riscontrato o la funzionalità proposta;
- i passi per riprodurre il problema (se applicabile);
- il comportamento atteso e quello effettivo.

Prima di aprire una nuova issue, verifica che non ne esista già una simile.

### 2. Proporre una modifica tramite Pull Request

1. Fai un **fork** del repository.
2. Crea un branch descrittivo a partire da `main`:

   ```bash
   git checkout -b fix/descrizione-del-fix
   # oppure
   git checkout -b feat/descrizione-della-feature
   ```

3. Apporta le modifiche necessarie (vedi il [README](README.md) per dettagli su struttura e dati).
4. Verifica le modifiche eseguendo il sito in locale (vedi la sezione *Eseguire il sito in locale* nel README).
5. Fai commit con un messaggio chiaro e descrittivo:

   ```bash
   git commit -m "fix: corretta visualizzazione mobile del menu"
   ```

6. Fai push del branch sul tuo fork e apri una **Pull Request** verso `main` del repository originale.

---

## Cosa puoi modificare

| Tipo di modifica | Dove agire |
|---|---|
| Testi e struttura HTML | File `.html` nella root |
| Stile e layout | `css/style.css` |
| Comportamento JavaScript | File in `js/` |
| Dati dell'edizione corrente (agenda, staff, sponsor, CFP) | `data/editions/<anno>.json` |
| Indice delle edizioni | `data/editions.json` |
| Immagini staff / loghi sponsor | `assets/staff/` / `assets/sponsors/` |

---

## Convenzioni

- Mantieni il codice **coerente con lo stile esistente**: indentazione a 2 spazi per HTML/CSS/JS, virgolette singole in JavaScript.
- Usa nomi di file in minuscolo con trattini come separatore (es. `nome-cognome.png`).
- I messaggi di commit seguono lo schema `tipo: descrizione` (es. `feat:`, `fix:`, `docs:`, `style:`, `chore:`).
- Non introdurre dipendenze esterne (librerie npm, CDN aggiuntivi) senza discussione preventiva in una issue.
- Non modificare il comportamento del sito per sole ragioni estetiche personali; proponi prima la modifica in una issue.

---

## Domande

Per qualsiasi dubbio, apri una issue o contatta il team tramite i canali social indicati nel sito.
