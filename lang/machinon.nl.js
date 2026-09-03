// Dutch. Machine-translated from the English template (lang/machinon.en.js);
// corrections welcome via pull request. The English file defines the key set.
language = {
  common: {
    and: "en",
    more: "meer",
    close: "Sluiten"
  },
  header: {
    mainmenu: "Hoofdmenu",
    type_to_search: "Typ om te zoeken",
    search_placeholder: "Naam, Oms, Idx, Status"
  },
  hub: {
    loading: "Laden..",
    house_managed: "Huisinstelling, beheerd door een beheerder",
    house_badge: "huis",
    reload_note: "Werkt na opnieuw laden",
    reload_now: "Nu opnieuw laden",
    groups: {
      general: "Algemeen",
      menus: "Menu's en navigatiebalk",
      dashboard: "Dashboard",
      cards: "Apparaatkaarten",
      charts: "Grafieken en log",
      background: "Achtergrond en huisstijl",
      colors: "Kleuren en schema's",
      iconpacks: "Iconen",
      about: "Over"
    },
    settings: {
      standby: {
        label: "Schermstandby",
        description: "Na een periode zonder activiteit vervaagt de hele pagina naar een donker klokscherm; een tik of klik haalt hem terug."
      },
      standby_after: {
        label: "Standby na (minuten)",
        description: "Bepaalt na hoeveel minuten zonder activiteit de schermstandby begint. Werkt alleen als Schermstandby ook aan staat."
      },
      check_update: {
        label: "Updatemelding",
        description: "Controleert op GitHub of er een nieuwere versie van het thema is en toont een melding als die er is. Los van de eigen app-updatecontrole van Domoticz."
      },
      warn_timeout: {
        label: "Waarschuwingen bij sensortimeout",
        description: "Toont een melding wanneer een sensor niets meer doorgeeft. Het waarschuwingsicoon naast de apparaatnaam verschijnt hoe dan ook."
      },
      warn_battery: {
        label: "Waarschuwingen bij lage batterij",
        description: "Toont een melding wanneer een apparaat een lage batterij meldt. Het waarschuwingsicoon naast de apparaatnaam verschijnt hoe dan ook."
      },
      warn_repeat: {
        label: "Hoe vaak waarschuwingen zich herhalen",
        description: "Hoe vaak hetzelfde apparaat je opnieuw mag waarschuwen: eens per bezoek, eens per dag, of alleen wanneer het probleem verdwijnt en terugkomt. Het waarschuwingsicoon naast de apparaatnaam verschijnt hoe dan ook."
      },
      center_popups: {
        label: "Pop-upvensters centreren",
        description: "Dwingt elk pop-upvenster naar een vaste gecentreerde positie, in plaats van waar Domoticz het anders zou plaatsen."
      },
      rgbw_popup: {
        label: "Machinon-kleurkiezer",
        description: "Vervangt de eigen kleurkiezer van Domoticz door een kleurkiezer in Machinon-stijl voor gekleurde lampen."
      },
      footer_text_disabled: {
        label: "Voettekst verbergen",
        description: "Verbergt de copyrightregel die Domoticz onderaan elke pagina toont."
      },
      floorplan_popup_details: {
        label: "Uitklapbare plattegrondvensters",
        description: "Zet de uitklappijl op plattegrondvensters van apparaten terug (standaard verborgen), waarmee de snelkoppelingen Log en Notificaties zichtbaar worden."
      },
      custom_settings_menu: {
        label: "Instellingenmenu als tegelraster",
        description: "Vervangt het uitklapmenu Instellingen door een paginavullend raster van icoontegels, een per instellingenpagina."
      },
      navbar_icons: {
        label: "Iconen in de navigatiebalk",
        description: "Toont het kleine icoon naast het label van elk item in de navigatiebalk. Standaard verborgen."
      },
      navbar_icons_text: {
        label: "Alleen iconen in de navigatiebalk (tekst verbergen)",
        description: "Verbergt de tekst van elk item in de navigatiebalk, zodat alleen het icoon overblijft. Werkt alleen als Iconen in de navigatiebalk ook aan staat."
      },
      custom_page_menu: {
        label: "Eigen menupagina",
        description: "Voegt een extra item aan de navigatiebalk toe dat een webpagina naar keuze laadt in plaats van de gebruikelijke Domoticz-pagina."
      },
      button_name: {
        label: "Knopnaam van de eigen pagina",
        description: "Bepaalt de labeltekst op de navigatiebalkknop van de eigen menupagina. Werkt alleen als Eigen menupagina ook aan staat."
      },
      custom_url: {
        label: "URL van de eigen pagina",
        description: "Bepaalt het adres dat de eigen menupagina laadt. Werkt alleen als Eigen menupagina ook aan staat."
      },
      sidemenu: {
        label: "Zijmenu op desktop",
        description: "Zet desktopschermen over op hetzelfde inklapbare zijmenu dat telefoons al gebruiken, in plaats van de horizontale navigatiebalk bovenaan."
      },
      dashboard_show_last_update: {
        label: "Laatst-gezien-regel op dashboardkaarten",
        description: "Toont de tijd van de laatste update van elk apparaat als een kleine regel op zijn dashboardkaart."
      },
      dashboard_columns: {
        label: "Kolomindeling op brede schermen",
        description: "Op schermen van 1200px en breder plaatst het dashboard zijn secties naast elkaar in kolommen in plaats van ze over de volle breedte te stapelen."
      },
      dashboard_camera: {
        label: "Cameravoorbeelden op het dashboard",
        description: "Voegt live miniaturen van camera's toe aan het dashboard, die met een vast interval worden ververst. De twee eigen instellingen hieronder bepalen waar ze verschijnen en hoe vaak ze verversen."
      },
      dashboard_camera_refresh: {
        label: "Verversing van cameravoorbeeld (seconden)",
        description: "Bepaalt hoeveel seconden er tussen twee verversingen van elke cameraminiatuur zitten. Werkt alleen als Cameravoorbeelden op het dashboard ook aan staat."
      },
      dashboard_camera_section: {
        label: "Aparte camerasectie",
        description: "Groepeert alle camera's in een eigen sectie \"Camera's\" bovenaan het dashboard; uit verschijnt het voorbeeld van elke camera op de plek van de statustekst van dat apparaat, overal waar het staat. Werkt alleen als Cameravoorbeelden op het dashboard ook aan staat."
      },
      time_ago: {
        label: "Relatieve tijden",
        description: "Toont de tijd van de laatste update van een apparaat als een relatieve tekst zoals \"5 minuten geleden\" in plaats van de kale datum en tijd."
      },
      fade_off_items: {
        label: "Uitgeschakelde apparaten dimmen",
        description: "Kaarten van apparaten die uit staan dimmen"
      },
      switch_instead_of_bigtext: {
        label: "Schakelaars in plaats van statustekst",
        description: "Vervangt de gewone Aan/Uit-statustekst op de kaart van een eenvoudige schakelaar door een schuifje dat je direct kunt omzetten, zonder het apparaat te openen."
      },
      switch_instead_of_bigtext_scenes: {
        label: "Ook schakelaars op scenekaarten",
        description: "Breidt hetzelfde schuifje uit naar Scene- en Groepkaarten. Werkt alleen als Schakelaars in plaats van statustekst ook aan staat."
      },
      wind_direction: {
        label: "Richting van de windpijl",
        description: "Domoticz meldt de richting WAARUIT de wind komt, en de pijl wijst normaal die kant op. Zet dit aan om hem de andere kant op te laten wijzen, naar WAARHEEN de wind waait. Het kompaslabel (N, ZW) blijft altijd de gemelde richting. Heeft alleen effect op de klassieke afbeeldingsiconen; staat Instellingen > Icoonstijl op glyphs, dan is de pijl van Domoticz zelf en doet deze instelling niets."
      },
      icon_image: {
        label: "Apparaatfoto's in plaats van iconen",
        description: "Toont een eigen foto als kaarticoon van een apparaat in plaats van het normale aan/uit-icoon. Stel je per apparaat in met de editor die hiermee verschijnt."
      },
      card_min_width: {
        label: "Minimale kaartbreedte",
        description: "Bepaalt in pixels hoe smal een apparaatkaart mag worden voordat het raster naar minder kolommen overgaat."
      },
      card_max_width: {
        label: "Maximale kaartbreedte",
        description: "Bepaalt in pixels hoe breed een apparaatkaart mag worden als er ruimte over is in de rij."
      },
      log_plot_bands: {
        label: "Bereikbanden in loggrafieken",
        description: "Tekent de gekleurde drempelbanden uit het Bar Ranges-venster van een apparaat in de grafiek op zijn Log-pagina, waar Domoticz zelf ze nooit tekent."
      },
      background_img: {
        label: "Achtergrondafbeelding",
        description: "Bepaalt de afbeelding die als paginaachtergrond wordt gebruikt. Geef een webadres of de naam van een afbeeldingsbestand in de images-map van het thema; laat leeg voor geen achtergrondafbeelding."
      },
      background_type: {
        label: "Achtergrondtype",
        description: "Kiest hoe de achtergrondafbeelding wordt weergegeven: uitgerekt over het hele scherm (cover), of op ware grootte herhaald als patroon."
      },
      logo: {
        label: "Eigen logo",
        description: "Bepaalt een andere afbeelding als logo in de navigatiebalk, in plaats van het standaardlogo van Machinon. Geef de naam van een afbeeldingsbestand in de images-map van het thema."
      },
      hide_logo: {
        label: "Logo verbergen",
        description: "Verbergt de logoafbeelding in de navigatiebalk volledig en laat die ruimte leeg."
      },
      scheme: {
        label: "Kleurenschema",
        description: "Bepaalt het volledige kleurenschema van het thema: een lichte of donkere basis, met benoemde kleurpaletten."
      },
      custom_color_scheme: {
        label: "Eigen kleuren",
        description: "Bouwt je eigen kleurenschema door 7 losse kleuren te kiezen."
      },
      iconpacks: {
        label: "Iconenbibliotheek",
        description: "Blader door de iconenbibliotheek en installeer precies de iconen die je wilt op afzonderlijke apparaten."
      },
      about: {
        label: "Over Machinon",
        description: "Themaversie, omschrijving, credits, links en onderhoudsacties"
      }
    },
    iconlib: {
      load_failed: "Iconenbibliotheek niet gevonden in deze thema-installatie ({error}).",
      no_match: "Geen enkel icoon komt overeen met de zoekopdracht.",
      installed_chip: "Geïnstalleerd",
      install: "Installeren",
      installed_current: "Geïnstalleerd en actueel",
      update_available: "Update beschikbaar: opnieuw installeren",
      not_installed: "Niet geïnstalleerd",
      remove: "Verwijderen",
      counter: "{count} van {total} geïnstalleerd",
      install_all: "Alles installeren / bijwerken",
      install_shown: "Getoonde installeren / bijwerken ({count})"
    },
    appliesTo: {
      whole_ui: "Hele interface",
      navbar_badge: "Badge in navigatiebalk",
      toasts: "Meldingen",
      all_dialogs: "Alle dialoogvensters",
      color_light_devices: "Gekleurde lampen",
      page_footer: "Paginavoettekst",
      floorplan: "Plattegrond",
      setup_menu: "Instellingenmenu",
      navbar: "Navigatiebalk",
      navbar_new_page: "Navigatiebalk + nieuwe pagina",
      desktop_layout: "Desktopindeling",
      classic_dashboard: "Klassiek dashboard",
      all_device_pages: "Alle apparaatpagina's",
      device_scene_cards: "Apparaat- en scenekaarten",
      wind_device_cards: "Windapparaatkaarten",
      device_cards: "Apparaatkaarten",
      all_card_grids: "Alle kaartrasters",
      device_log_charts: "Grafieken op de apparaatlog",
      device_icons: "Apparaaticonen",
      theme: "Thema"
    },
    options: {
      background_type: {
        cover: "Cover",
        pattern: "Patroon"
      },
      warn_repeat: {
        visit: "Eens per bezoek",
        daily: "Eens per dag",
        episode: "Alleen bij verandering"
      }
    },
    about: {
      aria: "Over dit thema",
      title: "Machinon-thema V.{version}",
      short_description: "Een modern Domoticz-thema met kleurenschema's, Theme Hub-instellingen, "
        + "vernieuwde iconen en lichte en donkere varianten. Zie het tabblad Over voor details "
        + "en onderhoud.",
      description: "Machinon levert een ingebouwde iconenbibliotheek met meer dan 250 iconen om "
        + "door te bladeren en uit te installeren, die rechtstreeks in de apparatendatabase van "
        + "Domoticz worden geschreven, zodat elk geïnstalleerd icoon beschikbaar is in de "
        + "icoonkiezer van elk apparaat en niet alleen op de kaarten van dit thema. Deze "
        + "instellingenhub past elke wijziging live toe met directe voorbeelden, biedt lichte en "
        + "donkere kleurenschema's plus een eigen palet met automatische contrastcontrole, en het "
        + "thema zelf is volledig responsief met een mobiele indeling die op een telefoonscherm "
        + "past.",
      contributions: "Bijdragen",
      role_design: "Ontwerp",
      role_code: "Code",
      link_repo: "GitHub-repository",
      link_wiki: "Wiki",
      icons8_credit: "Iconen van Icons8"
    },
    maintenance: {
      aria: "Thema-onderhoud",
      title: "Onderhoud",
      note: "Elke actie vraagt eerst om bevestiging.",
      reset_theme: "Thema terugzetten naar standaardwaarden",
      reset_theme_confirm: "Alle thema-instellingen terugzetten naar hun standaardwaarden? Dit verwijdert de opgeslagen thema-instellingen en laadt de pagina opnieuw.",
      clear_cache: "Instellingen in de cache wissen",
      clear_cache_confirm: "De thema-instellingen in de cache van deze browser wissen en opnieuw laden? Je instellingen die op de server zijn opgeslagen blijven behouden.",
      reset_colors: "Kleuren terugzetten naar het gekozen schema",
      reset_colors_confirm: "De eigen kleuren terugzetten naar het standaardpalet van het gekozen schema?",
      promote: "Mijn huidige voorkeuren opslaan als huisstandaard",
      promote_confirm: "Je huidige persoonlijke instellingen over de huisstandaard kopiëren? Je eigen instellingen blijven van jou; dit verandert wat nieuwe gebruikers en gebruikers na een reset krijgen.",
      promote_done: "Huisstandaard bijgewerkt",
      reset_mine: "Mijn persoonlijke instellingen resetten",
      reset_mine_confirm: "Je persoonlijke thema-instellingen resetten? Je valt terug op de huisstandaard.",
      reset_house: "De huisstandaard resetten",
      reset_house_confirm: "De HUISstandaard terugzetten naar de fabriekswaarden? De persoonlijke instellingen van gebruikers blijven ongemoeid.",
      reset_partial: "Een deel van de reset is voltooid. Druk nogmaals op Reset om hem af te maken."
    },
    imageEditor: {
      help: "Koppelt een apparaat (via Idx) aan een afbeeldingsbestand in de images-map van het thema. Werkt met lampen die met een lampicoon worden getoond.",
      idx_aria: "Apparaat-Idx",
      idx_placeholder: "Idx",
      img_aria: "Naam van het afbeeldingsbestand",
      add: "Toevoegen",
      empty: "Nog geen apparaatafbeeldingen.",
      idx_cell: "Idx {idx}",
      remove: "Verwijderen",
      remove_aria: "Afbeelding voor apparaat {idx} verwijderen"
    },
    schemes: {
      swatches: {
        background: "Achtergrond",
        navbar: "Menu",
        item: "Item",
        main_color: "Hoofdkleur",
        main_text: "Tekst",
        alt_text: "Secundaire tekst",
        disabled: "Uitgeschakeld"
      },
      builtin: {
        light: { name: "Machinon Licht", desc: "De standaardstijl: helder blauw op wit" },
        dark: { name: "Machinon Donker", desc: "De standaardstijl: blauw dat gloeit op marineblauw" },
        custom: { name: "Eigen", desc: "Je eigen zeven kleuren" }
      },
      delete_preset: "Voorinstelling verwijderen",
      wheel_aria: "{label} kiezen met een kleurenwiel",
      hex_aria: "Hexwaarde van {label}",
      save_preset: "Opslaan als voorinstelling",
      preset_name_prompt: "Naam van de voorinstelling",
      light: "Licht",
      dark: "Donker",
      wcag_what_preset: "Voorinstelling \"{name}\" opgeslagen, maar die",
      wcag_what_custom: "Het eigen kleurenschema",
      wcag_body: "tekst op achtergrond {ratio}:1 (WCAG AA vereist 4.5)",
      wcag_alt: "secundaire tekst {ratio}:1 (WCAG AA vereist 4.5)",
      wcag_accent: "tekst op accentkleur {ratio}:1 (vereist 3.0)"
    },
    wizard: {
      aria: "Een thema maken",
      title: "Een thema maken",
      cancel: "Annuleren",
      back: "Terug",
      next: "Volgende",
      apply: "Toepassen",
      save_theme: "Thema opslaan",
      steps: {
        colours: "Kleuren",
        look: "Stijl",
        name: "Naam"
      },
      name_label: "Themanaam",
      name_placeholder: "Mijn thema",
      tint_toggle: "De grijstinten met een andere kleur tinten",
      accent_label: "Hoofdkleur",
      surface_label: "Grijstint",
      light: "Licht",
      dark: "Donker",
      drift_label: "Je kleur is aangepast zodat hij leesbaar blijft:",
      saved_lead: "Opgeslagen als twee schema's, “{name} Licht” en “{name} Donker”.",
      preview: {
        device: "Woonkamer",
        status: "21,4 °C · 47%",
        value: "Aan",
        device2: "Achterdeur",
        status2: "Niet beschikbaar"
      },
      looks: {
        crisp: { label: "Strak", description: "Witte kaarten op een grijze pagina, met zichtbare randen" },
        soft: { label: "Zacht", description: "Getinte grijstinten, kaarten die nauwelijks van de pagina komen, zachte randen" },
        deep: { label: "Diep", description: "Een rijk getinte pagina met kaarten die erboven zweven" }
      },
      lead_colours: "Kies je hoofdkleur. Al het andere wordt daaruit berekend en op contrast gecontroleerd.",
      hint_colours: "Alleen de kleurtoon wordt gebruikt, niet de exacte tint.",
      lead_look: "Kies een stijl. Elke stijl is jouw kleur, anders gerangschikt."
    }
  },
  toasts: {
    sensors_timed_out: "{count} sensoren hebben een time-out",
    devices_low_on_battery: "{count} apparaten met lage batterij",
    devices: "{count} apparaten",
    update_available: "Machinon versie {version} is beschikbaar!",
    update_action: "Klik hier om te downloaden",
    wcag_fails: "{what} haalt het WCAG-contrast niet: {failures}",
    name_pipe: "Een themanaam mag het teken | niet bevatten.",
    wizard_name_first: "Geef je thema eerst een naam.",
    wizard_unreadable: "Deze combinatie kon niet leesbaar worden gemaakt. Meld dit alsjeblieft.",
    wizard_created: "“{name}” aangemaakt.",
    icon_busy: "Er loopt nog een andere icoonbewerking",
    icon_installed: "{name} geïnstalleerd",
    icon_install_failed: "{name}: {error}",
    icon_removed: "{name} verwijderd",
    icon_remove_failed: "Kon {name} niet verwijderen",
    icon_usage_check_failed: "Kon niet controleren welke apparaten {name} gebruiken",
    icons_all_current: "Alle {count} pakketiconen zijn geïnstalleerd en actueel",
    icons_all_shown_current: "Alle {count} getoonde pakketiconen zijn geïnstalleerd en actueel",
    icons_installing: "Installeren {n}/{total}: {name}",
    icons_summary: "{added} geïnstalleerd, {updated} bijgewerkt, {current} al actueel",
    icons_summary_failed: "{summary}; mislukt: {failures}",
    save_failed: "Thema-instellingen konden niet worden opgeslagen ({error})",
    save_failed_local: "Thema-instellingen konden niet in Domoticz worden opgeslagen; ze blijven alleen in deze browser."
  }
};
