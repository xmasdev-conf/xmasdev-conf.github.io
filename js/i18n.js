/* ============================================================
   XmasDev — i18n.js  (loaded first on every page)
   Lightweight bilingual engine: Italian (default) + English.

   - Language is stored in localStorage ('xmasdev-lang').
   - Static UI text is translated via [data-i18n] attributes
     using the DICTIONARY below.
   - JSON-driven content is translated via I18n.pick(), which
     accepts either a plain string (returned as-is) or an
     object shaped like { it: "...", en: "..." }.
   - A language toggle is injected into every navbar. Switching
     language persists the choice and reloads the page so that
     every script re-renders in the chosen language.
   ============================================================ */

(function () {
  const STORAGE_KEY = 'xmasdev-lang';
  const SUPPORTED = ['it', 'en'];
  const DEFAULT_LANG = 'it';

  /* ---- Static UI dictionary -------------------------------- */
  const DICTIONARY = {
    it: {
      'meta.homeTitle': 'XmasDev — Home',
      'meta.agendaTitle': 'XmasDev — Agenda',
      'meta.sponsorsTitle': 'XmasDev — Sponsor',
      'meta.staffTitle': 'XmasDev — Staff',
      'meta.editionsTitle': 'XmasDev — Edizioni precedenti',

      'skip': 'Salta al contenuto principale',
      'nav.aria': 'Navigazione principale',
      'nav.home': 'Home',
      'nav.agenda': 'Agenda',
      'nav.sponsors': 'Sponsor',
      'nav.staff': 'Staff',
      'nav.editions': 'Edizioni precedenti',
      'nav.register': 'Registrati',
      'nav.menuToggle': 'Apri o chiudi il menu di navigazione',
      'nav.langToggle': 'Switch to English',

      'hero.eyebrow': 'Edizione 2026',
      'hero.title': 'La conferenza tecnica<br>di <span class="highlight">fine anno</span>',
      'hero.subtitle': 'Una giornata di talk, workshop e networking dedicata a una community unita: lo stesso spirito di condivisione e vicinanza tipico del periodo natalizio, in chiave inclusiva e aperta a tutti.',
      'hero.date': '11 Dicembre 2026',
      'hero.place': 'Roma, Italia',
      'hero.time': '09:00 – 18:00',
      'hero.registerNow': 'Registrati ora',
      'hero.viewAgenda': "Guarda l'agenda",

      'stats.speakers': 'Speaker',
      'stats.tracks': 'Track',
      'stats.participants': 'Partecipanti',
      'stats.day': 'Giornata',

      'about.title': "Cos'è XmasDev?",
      'about.desc': "Una conferenza pensata per sviluppatori, by developers for developers, che celebra la collaborazione e l'unione della community nel periodo di fine anno.",
      'about.talksTitle': 'Talk tecnici',
      'about.talksDesc': 'Speaker di livello nazionale e internazionale affrontano argomenti concreti e di frontiera dello sviluppo software.',
      'about.workshopTitle': 'Workshop pratici',
      'about.workshopDesc': 'Sessioni hands-on per sporcarsi le mani con le tecnologie più interessanti del momento.',
      'about.networkingTitle': 'Networking',
      'about.networkingDesc': 'Spazi dedicati per incontrare altri sviluppatori, condividere esperienze e costruire connessioni professionali.',
      'about.communityTitle': 'Community',
      'about.communityDesc': 'Un evento organizzato dalla community, per la community. Gratuito o a costo contenuto, accessibile a tutti.',

      'event.title': 'Un giorno dedicato al <span style="color:var(--color-primary)">tuo</span> percorso da sviluppatore',
      'event.desc': "XmasDev nasce dall'idea che la crescita professionale passa anche dallo scambio con i propri pari. L'evento si svolge in una giornata intensa, ricca di contenuti di qualità e momenti informali, con l'obiettivo di creare legami duraturi nella community.",
      'event.li1': '3 track tecniche + 1 workshop pratico',
      'event.li2': 'Speaker selezionati dalla community',
      'event.li3': 'Solo slot da 40 minuti + 5 minuti di domande',
      'event.li4': 'Pranzo e coffee break inclusi',
      'event.li5': 'Streaming live per chi non può essere presente',

      'homeSponsors.becomeSponsor': 'Diventa sponsor',
      'cfp.body': 'Condividi la tua esperienza con la community: stiamo cercando talk che ispirino confronto, collaborazione e unione tra professionisti con background diversi.',
      'cfp.deadlineLabel': 'Chiusura CFP:',
      'cfp.submit': 'Invia la tua proposta →',

      'registration.openTitle': 'Prenota il tuo posto 🎁',
      'registration.openDesc': "I posti sono limitati. Registrati ora per assicurarti un posto alla conferenza più cool dell'anno!",
      'registration.openCta': 'Registrati gratuitamente →',
      'registration.closedTitle': 'Registrazione prossimamente disponibile',
      'registration.closedDesc': 'Le iscrizioni non sono ancora aperte. Ti aggiorneremo appena sarà possibile registrarsi.',
      'registration.closedCta': 'Registrazione non ancora aperta',
      'registration.closedMessage': 'La registrazione non è ancora aperta. Torna presto per assicurarti un posto.',

      'footer.brandDesc': 'La conferenza tecnica natalizia per la community degli sviluppatori italiani.',
      'footer.pages': 'Pagine',
      'footer.event': 'Evento',
      'footer.community': 'Community',
      'footer.about': 'Chi siamo',
      'footer.location': 'Location',
      'footer.registration': 'Registrazione',
      'footer.rights': '© 2026 XmasDev Conference. Tutti i diritti riservati.',
      'footer.madeWith': 'Made with ❤️ by the community',
      'footer.organizedBy': 'Organizzato dalle community',
      'footer.supportedBy': 'Con il supporto delle community',

      'agendaPage.title': '🗓 Agenda',
      'agendaPage.subtitle': 'Il programma completo della conferenza. 3 track + workshop, con slot da 40 minuti + 5 di domande.',
      'agenda.allTracks': 'Tutte le track',
      'agenda.noSessionsTrack': 'Nessuna sessione disponibile per questa track.',
      'agenda.noSessionsEdition': 'Nessuna sessione disponibile per questa edizione.',
      'agenda.loading': 'Caricamento agenda in corso…',
      'agenda.soon': "L'agenda sarà disponibile a breve. Torna presto!",
      'agenda.empty': "Nessuna sessione disponibile per il momento.",
      'agenda.error': "Impossibile caricare l'agenda.",

      'sponsorsPage.title': '🤝 I nostri Sponsor',
      'sponsorsPage.subtitle': 'Grazie alle aziende che credono nella community degli sviluppatori e rendono XmasDev possibile.',
      'sponsorsPage.whyTitle': 'Perché sponsorizzare XmasDev?',
      'sponsorsPage.whyDesc': 'Raggiungi una community attiva e qualificata di sviluppatori professionisti.',
      'sponsorsPage.visibilityTitle': 'Visibilità',
      'sponsorsPage.visibilityDesc': "Il tuo logo su tutti i materiali dell'evento: sito, badge, slide e streaming live.",
      'sponsorsPage.targetTitle': 'Target qualificato',
      'sponsorsPage.targetDesc': '200+ sviluppatori, tech lead e decision maker che partecipano attivamente alla community.',
      'sponsorsPage.networkingTitle': 'Networking diretto',
      'sponsorsPage.networkingDesc': 'Booth fisico e spazio dedicato per incontrare i partecipanti durante i break.',
      'sponsorsPage.brandingTitle': 'Employer branding',
      'sponsorsPage.brandingDesc': 'Mostra la cultura aziendale e i valori tecnici del tuo team alla community.',
      'sponsorsPage.apply': 'Candidati come sponsor',
      'sponsors.currentTitle': 'Sponsor attuali',
      'sponsors.currentDesc': 'Le aziende già confermate per questa edizione.',
      'sponsors.packagesTitle': 'Diventa sponsor',
      'sponsors.packagesDesc': 'Scegli il livello più adatto alla tua azienda e supporta la community XmasDev.',
      'sponsors.packDefaultTitle': 'Pacchetti sponsor',
      'sponsors.empty': 'Le informazioni sugli sponsor saranno disponibili a breve.',
      'sponsors.loading': 'Caricamento sponsor in corso…',
      'sponsors.error': 'Impossibile caricare i dati degli sponsor.',
      'sponsors.newTab': 'si apre in una nuova scheda',
      'sponsors.tierSuffix': 'sponsor',

      'staffPage.title': '👥 Il nostro Staff',
      'staffPage.subtitle': 'Il team di volontari appassionati che rende possibile questa edizione di XmasDev.',
      'staffPage.joinTitle': 'Vuoi far parte del team? 🙋',
      'staffPage.joinDesc': "XmasDev è un evento organizzato da volontari. Se hai voglia di contribuire, scrivici!",
      'staffPage.contact': 'Contattaci →',
      'staff.empty': 'Informazioni sullo staff non ancora disponibili.',
      'staff.loading': 'Caricamento staff…',
      'staff.error': 'Impossibile caricare i dati dello staff.',

      'editionsPage.title': '🗂 Edizioni precedenti',
      'editionsPage.subtitle': 'Uno sguardo rapido agli anni passati della community XmasDev.',
      'editions.empty': 'Nessuna edizione precedente disponibile al momento.',
      'editions.loading': 'Caricamento edizioni…',
      'editions.error': 'Impossibile caricare le edizioni precedenti.',
      'editions.editionOf': 'Edizione del',
      'editions.genericDesc': 'Edizione precedente della conference XmasDev.',
    },
    en: {
      'meta.homeTitle': 'XmasDev — Home',
      'meta.agendaTitle': 'XmasDev — Agenda',
      'meta.sponsorsTitle': 'XmasDev — Sponsors',
      'meta.staffTitle': 'XmasDev — Staff',
      'meta.editionsTitle': 'XmasDev — Past editions',

      'skip': 'Skip to main content',
      'nav.aria': 'Main navigation',
      'nav.home': 'Home',
      'nav.agenda': 'Agenda',
      'nav.sponsors': 'Sponsors',
      'nav.staff': 'Staff',
      'nav.editions': 'Past editions',
      'nav.register': 'Register',
      'nav.menuToggle': 'Open or close the navigation menu',
      'nav.langToggle': 'Passa all\u2019italiano',

      'hero.eyebrow': '2026 Edition',
      'hero.title': 'The end-of-year<br>tech <span class="highlight">conference</span>',
      'hero.subtitle': 'A day of talks, workshops and networking for a united community: the same spirit of sharing and closeness typical of the Christmas season, in an inclusive way and open to everyone.',
      'hero.date': 'December 11, 2026',
      'hero.place': 'Rome, Italy',
      'hero.time': '09:00 – 18:00',
      'hero.registerNow': 'Register now',
      'hero.viewAgenda': 'View the agenda',

      'stats.speakers': 'Speakers',
      'stats.tracks': 'Tracks',
      'stats.participants': 'Attendees',
      'stats.day': 'Day',

      'about.title': 'What is XmasDev?',
      'about.desc': 'A conference designed for developers, by developers for developers, celebrating collaboration and the unity of the community during the end-of-year season.',
      'about.talksTitle': 'Technical talks',
      'about.talksDesc': 'National and international speakers cover practical and cutting-edge software development topics.',
      'about.workshopTitle': 'Hands-on workshops',
      'about.workshopDesc': 'Hands-on sessions to get your hands dirty with the most interesting technologies of the moment.',
      'about.networkingTitle': 'Networking',
      'about.networkingDesc': 'Dedicated spaces to meet other developers, share experiences and build professional connections.',
      'about.communityTitle': 'Community',
      'about.communityDesc': 'An event organized by the community, for the community. Free or low-cost, accessible to everyone.',

      'event.title': 'A day dedicated to <span style="color:var(--color-primary)">your</span> journey as a developer',
      'event.desc': 'XmasDev is born from the idea that professional growth also comes from exchanging with your peers. The event takes place in one intense day, full of quality content and informal moments, with the goal of building lasting bonds within the community.',
      'event.li1': '3 technical tracks + 1 hands-on workshop',
      'event.li2': 'Speakers selected by the community',
      'event.li3': '40-minute slots + 5 minutes of Q&A only',
      'event.li4': 'Lunch and coffee breaks included',
      'event.li5': 'Live streaming for those who cannot attend',

      'homeSponsors.becomeSponsor': 'Become a sponsor',
      'cfp.body': 'Share your experience with the community: we are looking for talks that inspire discussion, collaboration and unity among professionals with different backgrounds.',
      'cfp.deadlineLabel': 'CFP closes:',
      'cfp.submit': 'Submit your proposal →',

      'registration.openTitle': 'Book your seat 🎁',
      'registration.openDesc': 'Seats are limited. Register now to secure your spot at the coolest conference of the year!',
      'registration.openCta': 'Register for free →',
      'registration.closedTitle': 'Registration coming soon',
      'registration.closedDesc': 'Registration is not open yet. We will keep you posted as soon as it becomes available.',
      'registration.closedCta': 'Registration not open yet',
      'registration.closedMessage': 'Registration is not open yet. Check back soon to secure your seat.',

      'footer.brandDesc': 'The Christmas tech conference for the Italian developer community.',
      'footer.pages': 'Pages',
      'footer.event': 'Event',
      'footer.community': 'Community',
      'footer.about': 'About us',
      'footer.location': 'Location',
      'footer.registration': 'Registration',
      'footer.rights': '© 2026 XmasDev Conference. All rights reserved.',
      'footer.madeWith': 'Made with ❤️ by the community',
      'footer.organizedBy': 'Organized by the communities',
      'footer.supportedBy': 'Supported by the communities',

      'agendaPage.title': '🗓 Agenda',
      'agendaPage.subtitle': 'The full conference program. 3 tracks + workshop, with 40-minute slots + 5 for questions.',
      'agenda.allTracks': 'All tracks',
      'agenda.noSessionsTrack': 'No sessions available for this track.',
      'agenda.noSessionsEdition': 'No sessions available for this edition.',
      'agenda.loading': 'Loading agenda…',
      'agenda.soon': 'The agenda will be available soon. Check back later!',
      'agenda.empty': 'No sessions available at the moment.',
      'agenda.error': 'Could not load the agenda.',

      'sponsorsPage.title': '🤝 Our Sponsors',
      'sponsorsPage.subtitle': 'Thanks to the companies that believe in the developer community and make XmasDev possible.',
      'sponsorsPage.whyTitle': 'Why sponsor XmasDev?',
      'sponsorsPage.whyDesc': 'Reach an active and qualified community of professional developers.',
      'sponsorsPage.visibilityTitle': 'Visibility',
      'sponsorsPage.visibilityDesc': 'Your logo on all event materials: website, badges, slides and live streaming.',
      'sponsorsPage.targetTitle': 'Qualified audience',
      'sponsorsPage.targetDesc': '200+ developers, tech leads and decision makers actively involved in the community.',
      'sponsorsPage.networkingTitle': 'Direct networking',
      'sponsorsPage.networkingDesc': 'Physical booth and dedicated space to meet attendees during the breaks.',
      'sponsorsPage.brandingTitle': 'Employer branding',
      'sponsorsPage.brandingDesc': 'Show your company culture and your team\u2019s technical values to the community.',
      'sponsorsPage.apply': 'Apply as a sponsor',
      'sponsors.currentTitle': 'Current sponsors',
      'sponsors.currentDesc': 'The companies already confirmed for this edition.',
      'sponsors.packagesTitle': 'Become a sponsor',
      'sponsors.packagesDesc': 'Choose the level that best fits your company and support the XmasDev community.',
      'sponsors.packDefaultTitle': 'Sponsorship packages',
      'sponsors.empty': 'Sponsor information will be available soon.',
      'sponsors.loading': 'Loading sponsors…',
      'sponsors.error': 'Could not load sponsor data.',
      'sponsors.newTab': 'opens in a new tab',
      'sponsors.tierSuffix': 'sponsor',

      'staffPage.title': '👥 Our Staff',
      'staffPage.subtitle': 'The team of passionate volunteers that makes this edition of XmasDev possible.',
      'staffPage.joinTitle': 'Want to join the team? 🙋',
      'staffPage.joinDesc': 'XmasDev is an event organized by volunteers. If you want to contribute, write to us!',
      'staffPage.contact': 'Contact us →',
      'staff.empty': 'No staff information available yet.',
      'staff.loading': 'Loading staff…',
      'staff.error': 'Could not load staff data.',

      'editionsPage.title': '🗂 Past editions',
      'editionsPage.subtitle': 'A quick look at the past years of the XmasDev community.',
      'editions.empty': 'No previous editions available at the moment.',
      'editions.loading': 'Loading editions…',
      'editions.error': 'Could not load previous editions.',
      'editions.editionOf': 'Edition of',
      'editions.genericDesc': 'Previous edition of the XmasDev conference.',
    },
  };

  /* ---- Language resolution --------------------------------- */
  function normalizeLang(value) {
    if (typeof value !== 'string') return null;
    const short = value.trim().toLowerCase().slice(0, 2);
    return SUPPORTED.includes(short) ? short : null;
  }

  function resolveInitialLang() {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch { /* localStorage may be unavailable */ }

    return (
      normalizeLang(stored) ||
      normalizeLang(navigator.language) ||
      DEFAULT_LANG
    );
  }

  const currentLang = resolveInitialLang();

  /* ---- Public API ------------------------------------------ */
  const I18n = {
    get lang() {
      return currentLang;
    },

    /* Translate a static dictionary key. */
    t(key, fallback) {
      const table = DICTIONARY[currentLang] || DICTIONARY[DEFAULT_LANG];
      if (table && Object.prototype.hasOwnProperty.call(table, key)) {
        return table[key];
      }
      if (fallback !== undefined) return fallback;
      const base = DICTIONARY[DEFAULT_LANG];
      return base && base[key] !== undefined ? base[key] : key;
    },

    /*
     * Pick a localized value from JSON content.
     * Accepts a plain string (returned as-is, for backward
     * compatibility) or an object like { it, en }.
     */
    pick(value) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (currentLang in value) return value[currentLang];
        if (DEFAULT_LANG in value) return value[DEFAULT_LANG];
        const first = Object.values(value)[0];
        return typeof first === 'string' ? first : '';
      }
      return value;
    },

    setLang(next) {
      const normalized = normalizeLang(next);
      if (!normalized || normalized === currentLang) return;
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch { /* ignore */ }
      window.location.reload();
    },

    /* Apply static translations to the current document. */
    applyStatic(root) {
      const scope = root || document;

      scope.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = I18n.t(el.getAttribute('data-i18n'));
      });

      scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
        el.innerHTML = I18n.t(el.getAttribute('data-i18n-html'));
      });

      scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        // Format: "attr:key;attr2:key2"
        el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
          const [attr, key] = pair.split(':').map((s) => s && s.trim());
          if (attr && key) el.setAttribute(attr, I18n.t(key));
        });
      });
    },
  };

  window.I18n = I18n;

  /* ---- Language toggle injection --------------------------- */
  const LANG_META = {
    it: { flag: '🇮🇹', label: 'Italiano' },
    en: { flag: '🇬🇧', label: 'English' },
  };

  function injectToggle() {
    const links = document.getElementById('navbar-links');
    if (!links || document.getElementById('lang-toggle')) return;

    const li = document.createElement('li');
    li.className = 'navbar__lang';

    const group = document.createElement('div');
    group.id = 'lang-toggle';
    group.className = 'navbar__lang-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', I18n.t('nav.langToggle'));

    SUPPORTED.forEach((code) => {
      const meta = LANG_META[code];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'navbar__lang-flag';
      btn.dataset.lang = code;
      btn.textContent = meta.flag;
      btn.title = meta.label;
      btn.setAttribute('aria-label', meta.label);
      btn.setAttribute('lang', code);
      if (code === currentLang) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-current', 'true');
      }
      btn.addEventListener('click', () => I18n.setLang(code));
      group.appendChild(btn);
    });

    li.appendChild(group);
    links.appendChild(li);
  }

  /* ---- Boot ------------------------------------------------- */
  document.documentElement.lang = currentLang;

  document.addEventListener('DOMContentLoaded', () => {
    I18n.applyStatic(document);
    injectToggle();

    const titleKey = document.body && document.body.dataset.pageTitleKey;
    if (titleKey) {
      document.title = I18n.t(titleKey);
    }
  });
})();
