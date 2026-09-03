// Swedish. Machine-translated from the English template (lang/machinon.en.js);
// corrections welcome via pull request. The English file defines the key set.
language = {
  common: {
    and: "och",
    more: "till",
    close: "Stäng"
  },
  header: {
    mainmenu: "Huvudmeny",
    type_to_search: "Skriv för att söka",
    search_placeholder: "Namn, Beskr., Idx, Status"
  },
  hub: {
    loading: "Laddar..",
    house_managed: "Husinställning, hanteras av en administratör",
    house_badge: "hus",
    reload_note: "Träder i kraft efter omladdning",
    reload_now: "Ladda om nu",
    locked_token: "Den här sessionen kan inte spara inställningar (applikationstoken).",
    locked_version: "Ditt konto kan inte ändra temainställningar i den här versionen av Domoticz. Fråga en administratör, eller be dem uppdatera Domoticz.",
    no_backing: "Inställningen är inte tillgänglig (ingen tillhörande funktion).",
    groups: {
      // "Generella" matches core Domoticz sv; do not "fix" it to "Allmänt".
      general: "Generella",
      menus: "Menyer och navigeringsfält",
      dashboard: "Skrivbord",
      cards: "Enhetskort",
      charts: "Diagram och logg",
      background: "Bakgrund och varumärke",
      colors: "Färger och scheman",
      iconpacks: "Ikoner",
      about: "Om"
    },
    settings: {
      standby: {
        label: "Skärmvila",
        description: "Efter en tids inaktivitet tonar hela sidan ned till en mörk klockskärm; en tryckning eller ett klick tar tillbaka den."
      },
      standby_after: {
        label: "Vila efter (minuter)",
        description: "Anger hur många minuters inaktivitet som utlöser skärmvila. Gäller bara så länge Skärmvila också är på."
      },
      check_update: {
        label: "Uppdateringsmeddelande",
        description: "Kontrollerar på GitHub om det finns en nyare version av temat och visar ett meddelande om det gör det. Skilt från Domoticz egen kontroll av appuppdateringar."
      },
      warn_timeout: {
        label: "Varningar vid sensortidsgräns",
        description: "Visar ett meddelande när en sensor slutar rapportera. Varningsikonen bredvid enhetsnamnet visas ändå."
      },
      warn_battery: {
        label: "Varningar vid lågt batteri",
        description: "Visar ett meddelande när en enhet rapporterar lågt batteri. Varningsikonen bredvid enhetsnamnet visas ändå."
      },
      warn_repeat: {
        label: "Hur ofta varningar upprepas",
        description: "Hur ofta samma enhet får varna dig igen: en gång per besök, en gång om dagen, eller bara när problemet försvinner och kommer tillbaka. Varningsikonen bredvid enhetsnamnet visas ändå."
      },
      center_popups: {
        label: "Centrera popup-dialoger",
        description: "Tvingar varje popup-dialog till en fast centrerad position i stället för där Domoticz annars skulle placera den."
      },
      rgbw_popup: {
        label: "Machinons färgväljare",
        description: "Ersätter Domoticz egen färgväljare med en i Machinon-stil för färgade lampor."
      },
      footer_text_disabled: {
        label: "Dölj sidfotstext",
        description: "Döljer den upphovsrättsrad som Domoticz skriver ut längst ned på varje sida."
      },
      floorplan_popup_details: {
        label: "Expanderbara popup-fönster i planlösningen",
        description: "Återställer expanderingspilen på enheternas popup-fönster i planlösningen (dold som standard), vilket visar genvägarna Logg och Aviseringar."
      },
      custom_settings_menu: {
        label: "Inställningsmenyn som rutnät av paneler",
        description: "Ersätter rullgardinsmenyn Inställningar med ett helsidesrutnät av ikonpaneler, en per inställningssida."
      },
      navbar_icons: {
        label: "Ikoner i navigeringsfältet",
        description: "Visar den lilla ikonen bredvid etiketten för varje post i navigeringsfältet. Dold som standard."
      },
      navbar_icons_text: {
        label: "Endast ikoner i navigeringsfältet (dölj text)",
        description: "Döljer texten för varje post i navigeringsfältet så att bara ikonen blir kvar. Gäller bara så länge Ikoner i navigeringsfältet också är på."
      },
      custom_page_menu: {
        label: "Egen menysida",
        description: "Lägger till en extra post i navigeringsfältet som laddar en webbsida du väljer i stället för den vanliga Domoticz-sidan."
      },
      button_name: {
        label: "Knappnamn för den egna sidan",
        description: "Anger etikettexten på den egna menysidans knapp i navigeringsfältet. Gäller bara så länge Egen menysida också är på."
      },
      custom_url: {
        label: "Webbadress för den egna sidan",
        description: "Anger adressen som den egna menysidan laddar. Gäller bara så länge Egen menysida också är på."
      },
      sidemenu: {
        label: "Sidomeny på datorn",
        description: "Ställer om datorskärmar till samma hopfällbara sidomeny som telefoner redan använder, i stället för det vågräta navigeringsfältet högst upp."
      },
      dashboard_show_last_update: {
        label: "Rad med senast sedd på skrivbordskorten",
        description: "Visar varje enhets senaste uppdateringstid som en liten rad på dess skrivbordskort."
      },
      dashboard_columns: {
        label: "Kolumnlayout på breda skärmar",
        description: "På skärmar som är 1200px och bredare placeras skrivbordets sektioner i kolumner bredvid varandra i stället för staplade i full bredd."
      },
      dashboard_camera: {
        label: "Kameraförhandsvisningar på skrivbordet",
        description: "Lägger till miniatyrbilder från kamerorna i realtid på skrivbordet, uppdaterade med ett fast intervall. De två egna inställningarna nedan styr var de visas och hur ofta de uppdateras."
      },
      dashboard_camera_refresh: {
        label: "Uppdatering av kameraförhandsvisning (sekunder)",
        description: "Anger hur många sekunder som går mellan uppdateringar av varje kameras miniatyrbild. Gäller bara så länge Kameraförhandsvisningar på skrivbordet också är på."
      },
      dashboard_camera_section: {
        label: "Egen kamerasektion",
        description: "Samlar alla kameror i en egen sektion \"Kameror\" högst upp på skrivbordet; när den är avstängd visas varje kameras förhandsvisning i stället för enhetens statustext, överallt där den förekommer. Gäller bara så länge Kameraförhandsvisningar på skrivbordet också är på."
      },
      time_ago: {
        label: "Relativa tider",
        description: "Visar en enhets senaste uppdateringstid som ett relativt uttryck, till exempel \"för 5 minuter sedan\", i stället för rått datum och klockslag."
      },
      fade_off_items: {
        label: "Tona ned avstängda enheter",
        description: "Tona ned korten för enheter som är avstängda"
      },
      switch_instead_of_bigtext: {
        label: "Brytare i stället för statustext",
        description: "Ersätter den enkla På/Av-statustexten på en enkel brytares kort med ett reglage du kan slå om direkt, utan att öppna enheten."
      },
      switch_instead_of_bigtext_scenes: {
        label: "Brytare även på scenariokort",
        description: "Utökar samma reglage till scenario- och gruppkort. Gäller bara så länge Brytare i stället för statustext också är på."
      },
      wind_direction: {
        label: "Vindpilens riktning",
        description: "Domoticz rapporterar den riktning vinden kommer IFRÅN, och pilen pekar normalt åt det hållet. Slå på detta för att låta den peka åt motsatt håll, mot dit vinden blåser. Kompassetiketten (N, SV) förblir alltid den rapporterade. Påverkar bara de klassiska bildikonerna; med Settings > Icon style satt till glyfer kommer pilen från Domoticz själv och den här inställningen gör ingenting."
      },
      icon_image: {
        label: "Enhetsfoton i stället för ikoner",
        description: "Visar ett eget foto som en enhets kortikon i stället för dess vanliga på/av-ikon. Ställs in per enhet med redigeraren som detta visar."
      },
      card_min_width: {
        label: "Minsta kortbredd",
        description: "Anger i pixlar hur smalt ett enhetskort får krympa innan rutnätet bryter till färre kolumner."
      },
      card_max_width: {
        label: "Största kortbredd",
        description: "Anger i pixlar hur brett ett enhetskort får sträcka sig när det finns plats över i raden."
      },
      log_plot_bands: {
        label: "Intervallband i loggdiagram",
        description: "Ritar de färgade tröskelbanden från en enhets Bar Ranges-dialog i diagrammet på dess loggsida, där Domoticz själv aldrig ritar dem."
      },
      background_img: {
        label: "Bakgrundsbild",
        description: "Anger bilden som används som sidbakgrund. Ange en webbadress eller namnet på en bildfil i temats images-mapp; lämna tomt för ingen bakgrundsbild."
      },
      background_type: {
        label: "Bakgrundstyp",
        description: "Väljer hur bakgrundsbilden visas: utsträckt så att den fyller skärmen (cover), eller upprepad i sin ursprungliga storlek som ett mönster."
      },
      logo: {
        label: "Egen logotyp",
        description: "Anger en annan bild att använda som logotyp i navigeringsfältet, i stället för Machinons standardlogotyp. Ange namnet på en bildfil i temats images-mapp."
      },
      hide_logo: {
        label: "Dölj logotypen",
        description: "Döljer logotypbilden i navigeringsfältet helt och lämnar den ytan tom."
      },
      scheme: {
        label: "Färgschema",
        description: "Anger temats övergripande färgschema: en ljus eller mörk grund, med namngivna färgpaletter."
      },
      custom_color_scheme: {
        label: "Egna färger",
        description: "Bygger ditt eget färgschema genom att välja 7 enskilda färger."
      },
      iconpacks: {
        label: "Ikonbibliotek",
        description: "Bläddra i ikonbiblioteket och installera precis de ikoner du vill ha på enskilda enheter."
      },
      about: {
        label: "Om Machinon",
        description: "Temaversion, beskrivning, tack, länkar och underhållsåtgärder"
      }
    },
    iconlib: {
      load_failed: "Ikonbiblioteket hittades inte i den här temainstallationen ({error}).",
      no_match: "Inga ikoner matchar sökningen.",
      installed_chip: "Installerad",
      install: "Installera",
      installed_current: "Installerad och aktuell",
      update_available: "Uppdatering tillgänglig: installera om",
      not_installed: "Inte installerad",
      remove: "Ta bort",
      remove_confirm_used: "Ta bort ”{name}”? Används av: {users}. De här enheterna återgår till sin standardikon.",
      remove_confirm: "Ta bort ”{name}” från ikondatabasen?",
      counter: "{count} av {total} installerade",
      install_all: "Installera / uppdatera alla",
      install_shown: "Installera / uppdatera visade ({count})"
    },
    appliesTo: {
      whole_ui: "Hela gränssnittet",
      navbar_badge: "Bricka i navigeringsfältet",
      toasts: "Meddelanden",
      all_dialogs: "Alla dialoger",
      color_light_devices: "Färgade lampor",
      page_footer: "Sidfot",
      floorplan: "Planlösning",
      setup_menu: "Inställningsmenyn",
      navbar: "Navigeringsfält",
      navbar_new_page: "Navigeringsfält + ny sida",
      desktop_layout: "Datorlayout",
      classic_dashboard: "Klassiskt skrivbord",
      all_device_pages: "Alla enhetssidor",
      device_scene_cards: "Enhets- och scenariokort",
      wind_device_cards: "Kort för vindenheter",
      device_cards: "Enhetskort",
      all_card_grids: "Alla kortrutnät",
      device_log_charts: "Diagram i enhetsloggen",
      device_icons: "Enhetsikoner",
      theme: "Tema"
    },
    options: {
      background_type: {
        cover: "Cover",
        pattern: "Mönster"
      },
      warn_repeat: {
        visit: "En gång per besök",
        daily: "En gång om dagen",
        episode: "Bara när det ändras"
      }
    },
    about: {
      aria: "Om det här temat",
      title: "Machinon-temat V.{version}",
      short_description: "Ett modernt Domoticz-tema med färgscheman, inställningar i Theme Hub, "
        + "uppfräschade ikoner och ljusa och mörka varianter. Se fliken Om för detaljer och "
        + "underhåll.",
      description: "Machinon levereras med ett inbyggt ikonbibliotek på mer än 250 ikoner att "
        + "bläddra i och installera från, som skrivs rakt in i Domoticz enhetsdatabas, så att "
        + "varje installerad ikon är tillgänglig från vilken enhets egen ikonväljare som helst "
        + "och inte bara på det här temats kort. Den här inställningshubben tillämpar varje "
        + "ändring direkt med omedelbar förhandsvisning, erbjuder ljusa och mörka färgscheman "
        + "plus en egen palett med automatisk kontrastkontroll, och temat självt är helt "
        + "responsivt med en mobil layout som får plats på telefonskärmar.",
      contributions: "Medverkande",
      role_design: "Formgivning",
      role_code: "Kod",
      link_repo: "GitHub-arkiv",
      link_wiki: "Wiki",
      icons8_credit: "Ikoner av Icons8"
    },
    maintenance: {
      aria: "Temaunderhåll",
      title: "Underhåll",
      note: "Varje åtgärd ber om bekräftelse först.",
      reset_theme: "Återställ temat till standardvärden",
      reset_theme_confirm: "Återställa alla temainställningar till sina standardvärden? Detta raderar de sparade temainställningarna och laddar om sidan.",
      clear_cache: "Rensa cachade inställningar",
      clear_cache_confirm: "Rensa den här webbläsarens cachade temainställningar och ladda om? Dina inställningar som sparats på servern behålls.",
      reset_colors: "Återställ färgerna till det valda schemat",
      reset_colors_confirm: "Återställa de egna färgerna till det valda schemats standardpalett?",
      promote: "Spara mina nuvarande inställningar som husets standard",
      promote_confirm: "Kopiera dina nuvarande personliga inställningar över husets standardvärden? Dina egna inställningar förblir dina; detta ändrar vad nya användare och användare efter en återställning får.",
      promote_done: "Husets standardvärden uppdaterade",
      reset_mine: "Återställ mina personliga inställningar",
      reset_mine_confirm: "Återställa dina personliga temainställningar? Du faller tillbaka på husets standardvärden.",
      reset_house: "Återställ husets standardvärden",
      reset_house_confirm: "Återställa HUSETS standardvärden till fabriksvärden? Användarnas personliga inställningar rörs inte.",
      reset_partial: "En del av återställningen är klar. Tryck på Återställ igen för att slutföra."
    },
    imageEditor: {
      help: "Kopplar en enhet (via Idx) till en bildfil i temats images-mapp. Fungerar med lampor som visas med en glödlampsikon.",
      idx_aria: "Enhetens Idx",
      idx_placeholder: "Idx",
      img_aria: "Bildfilens namn",
      add: "Lägg till",
      empty: "Inga enhetsbilder ännu.",
      idx_cell: "Idx {idx}",
      remove: "Ta bort",
      remove_aria: "Ta bort bilden för enhet {idx}"
    },
    schemes: {
      swatches: {
        background: "Bakgrund",
        navbar: "Meny",
        item: "Objekt",
        main_color: "Huvudfärg",
        main_text: "Text",
        alt_text: "Sekundär text",
        disabled: "Inaktiverad"
      },
      builtin: {
        light: { name: "Machinon Ljus", desc: "Standardutseendet: rent blått på vitt" },
        dark: { name: "Machinon Mörk", desc: "Standardutseendet: blått som lyser mot marinblått" },
        custom: { name: "Anpassad", desc: "Dina egna sju färger" }
      },
      delete_preset: "Radera förinställning",
      wheel_aria: "Välj {label} med en färgcirkel",
      hex_aria: "Hex-värde för {label}",
      save_preset: "Spara som förinställning",
      preset_name_prompt: "Namn på förinställningen",
      light: "Ljus",
      dark: "Mörk",
      wcag_what_preset: "Förinställningen \"{name}\" sparades, men den",
      wcag_what_custom: "Det egna färgschemat",
      wcag_body: "text mot bakgrund {ratio}:1 (WCAG AA kräver 4.5)",
      wcag_alt: "sekundär text {ratio}:1 (WCAG AA kräver 4.5)",
      wcag_accent: "text mot accentfärg {ratio}:1 (kräver 3.0)"
    },
    wizard: {
      aria: "Skapa ett tema",
      title: "Skapa ett tema",
      cancel: "Avbryt",
      back: "Tillbaka",
      next: "Nästa",
      apply: "Verkställ",
      save_theme: "Spara temat",
      steps: {
        colours: "Färger",
        look: "Utseende",
        name: "Namn"
      },
      name_label: "Temanamn",
      name_placeholder: "Mitt tema",
      tint_toggle: "Tona gråtonerna med en annan färg",
      accent_label: "Huvudfärg",
      surface_label: "Gråton",
      light: "Ljus",
      dark: "Mörk",
      drift_label: "Din färg justerades för att förbli läsbar:",
      saved_lead: "Sparat som två scheman, ”{name} Ljus” och ”{name} Mörk”.",
      preview: {
        device: "Vardagsrum",
        status: "21,4 °C · 47%",
        value: "På",
        device2: "Bakdörr",
        status2: "Otillgänglig"
      },
      looks: {
        crisp: { label: "Skarp", description: "Vita kort på en grå sida, med kanter som syns" },
        soft: { label: "Mjuk", description: "Tonade gråtoner, kort som knappt lyfter från sidan, nätt och jämnt synliga kanter" },
        deep: { label: "Djup", description: "En rikt tonad sida med kort som svävar ovanför den" }
      },
      lead_colours: "Välj din huvudfärg. Allt annat räknas ut från den och kontrolleras för kontrast.",
      hint_colours: "Bara färgtonen används, inte den exakta nyansen.",
      lead_look: "Välj ett utseende. Vart och ett är din färg, ordnad på olika sätt."
    }
  },
  toasts: {
    sensors_timed_out: "{count} sensorer har nått tidsgränsen",
    devices_low_on_battery: "{count} enheter har lågt batteri",
    devices: "{count} enheter",
    update_available: "Machinon version {version} är tillgänglig!",
    update_action: "Klicka här för att ladda ner",
    wcag_fails: "{what} klarar inte WCAG-kontrasten: {failures}",
    name_pipe: "Ett temanamn får inte innehålla tecknet |.",
    wizard_name_first: "Ge ditt tema ett namn först.",
    wizard_unreadable: "Den kombinationen gick inte att göra läsbar. Rapportera gärna detta.",
    wizard_created: "”{name}” skapades.",
    icon_busy: "En annan ikonåtgärd pågår fortfarande",
    icon_installed: "{name} installerad",
    icon_install_failed: "{name}: {error}",
    icon_removed: "{name} borttagen",
    icon_remove_failed: "Kunde inte ta bort {name}",
    icon_usage_check_failed: "Kunde inte kontrollera vilka enheter som använder {name}",
    icons_all_current: "Alla {count} paketikoner är installerade och aktuella",
    icons_all_shown_current: "Alla {count} visade paketikoner är installerade och aktuella",
    icons_installing: "Installerar {n}/{total}: {name}",
    icons_summary: "{added} installerade, {updated} uppdaterade, {current} redan aktuella",
    icons_summary_failed: "{summary}; misslyckades: {failures}",
    save_failed: "Temainställningarna kunde inte sparas ({error})",
    save_failed_local: "Temainställningarna kunde inte sparas i Domoticz; de behålls bara i den här webbläsaren."
  }
};
