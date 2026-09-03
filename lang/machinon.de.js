// German. Machine-translated from the English template (lang/machinon.en.js);
// corrections welcome via pull request. The English file defines the key set.
language = {
  common: {
    and: "und",
    more: "weitere",
    close: "Schließen"
  },
  header: {
    mainmenu: "Hauptmenü",
    type_to_search: "Zum Suchen tippen",
    search_placeholder: "Name, Beschr., Idx, Status"
  },
  hub: {
    loading: "Wird geladen..",
    house_managed: "Haus-Einstellung, von einem Administrator verwaltet",
    house_badge: "Haus",
    reload_note: "Wirkt nach dem Neuladen",
    reload_now: "Jetzt neu laden",
    locked_token: "Diese Sitzung kann keine Einstellungen speichern (Anwendungstoken).",
    locked_version: "Dein Konto kann die Design-Einstellungen in dieser Domoticz-Version nicht ändern. Frage einen Administrator oder bitte ihn, Domoticz zu aktualisieren.",
    no_backing: "Einstellung nicht verfügbar (keine zugehörige Funktion).",
    groups: {
      general: "Allgemein",
      menus: "Menüs und Navigationsleiste",
      dashboard: "Übersicht",
      cards: "Gerätekarten",
      charts: "Diagramme und Protokoll",
      background: "Hintergrund und Branding",
      colors: "Farben und Schemata",
      iconpacks: "Symbole",
      about: "Über"
    },
    settings: {
      standby: {
        label: "Bildschirm-Standby",
        description: "Nach einer Zeit ohne Aktivität blendet die ganze Seite zu einer dunklen Uhranzeige ab; jede Berührung und jeder Klick holt sie zurück."
      },
      standby_after: {
        label: "Standby nach (Minuten)",
        description: "Legt fest, nach wie vielen Minuten ohne Aktivität das Bildschirm-Standby einsetzt. Gilt nur, solange auch Bildschirm-Standby eingeschaltet ist."
      },
      check_update: {
        label: "Update-Hinweis",
        description: "Prüft auf GitHub, ob eine neuere Version des Designs vorliegt, und zeigt bei Bedarf einen Hinweis. Unabhängig von der App-Update-Prüfung von Domoticz."
      },
      warn_timeout: {
        label: "Warnungen bei Sensor-Zeitüberschreitung",
        description: "Zeigt eine Meldung, wenn ein Sensor keine Daten mehr meldet. Das Warnsymbol neben dem Gerätenamen erscheint ohnehin."
      },
      warn_battery: {
        label: "Warnungen bei schwacher Batterie",
        description: "Zeigt eine Meldung, wenn ein Gerät eine schwache Batterie meldet. Das Warnsymbol neben dem Gerätenamen erscheint ohnehin."
      },
      warn_repeat: {
        label: "Wie oft Warnungen wiederholt werden",
        description: "Wie oft dasselbe Gerät dich erneut warnen darf: einmal pro Besuch, einmal am Tag oder nur, wenn das Problem verschwindet und wiederkommt. Das Warnsymbol neben dem Gerätenamen erscheint ohnehin."
      },
      center_popups: {
        label: "Popup-Dialoge zentrieren",
        description: "Zwingt jeden Popup-Dialog an eine feste zentrierte Position, statt dorthin, wo Domoticz ihn sonst platzieren würde."
      },
      rgbw_popup: {
        label: "Machinon-Farbwähler",
        description: "Ersetzt den Farbwähler von Domoticz bei Farblichtern durch einen im Machinon-Stil."
      },
      footer_text_disabled: {
        label: "Fußzeilentext ausblenden",
        description: "Blendet die Copyright-Zeile aus, die Domoticz unten auf jeder Seite ausgibt."
      },
      floorplan_popup_details: {
        label: "Aufklappbare Grundriss-Popups",
        description: "Stellt den Aufklapppfeil auf Grundriss-Gerätepopups wieder her (standardmäßig ausgeblendet) und zeigt damit die Verknüpfungen zu Protokoll und Benachrichtigungen."
      },
      custom_settings_menu: {
        label: "Einstellungsmenü als Kachelraster",
        description: "Ersetzt das Einrichtungs-Dropdown durch ein seitenfüllendes Raster aus Symbolkacheln, eine je Einstellungsseite."
      },
      navbar_icons: {
        label: "Symbole in der Navigationsleiste",
        description: "Zeigt das kleine Symbol neben der Beschriftung jedes Eintrags der Navigationsleiste. Standardmäßig ausgeblendet."
      },
      navbar_icons_text: {
        label: "Nur Symbole in der Navigationsleiste (Text ausblenden)",
        description: "Blendet den Text jedes Eintrags der Navigationsleiste aus, sodass nur das Symbol bleibt. Gilt nur, solange auch die Option Symbole in der Navigationsleiste eingeschaltet ist."
      },
      custom_page_menu: {
        label: "Eigene Menüseite",
        description: "Fügt der Navigationsleiste einen zusätzlichen Eintrag hinzu, der anstelle der üblichen Domoticz-Seite eine Webseite deiner Wahl lädt."
      },
      button_name: {
        label: "Beschriftung der eigenen Seite",
        description: "Legt den Text auf der Schaltfläche der eigenen Menüseite in der Navigationsleiste fest. Gilt nur, solange auch Eigene Menüseite eingeschaltet ist."
      },
      custom_url: {
        label: "URL der eigenen Seite",
        description: "Legt die Adresse fest, die die eigene Menüseite lädt. Gilt nur, solange auch Eigene Menüseite eingeschaltet ist."
      },
      sidemenu: {
        label: "Seitenmenü auf dem Desktop",
        description: "Stellt Desktop-Bildschirme auf dasselbe einklappbare Seitenmenü um, das Telefone bereits nutzen, und ersetzt damit die waagerechte Navigationsleiste am oberen Rand."
      },
      dashboard_show_last_update: {
        label: "Zuletzt-gesehen-Zeile auf Übersichtskarten",
        description: "Zeigt die Zeit der letzten Aktualisierung eines Geräts als kleine Zeile auf seiner Übersichtskarte."
      },
      dashboard_columns: {
        label: "Spaltenlayout auf breiten Bildschirmen",
        description: "Auf Bildschirmen ab 1200px Breite ordnet die Übersicht ihre Abschnitte nebeneinander in Spalten an, statt sie über die volle Breite zu stapeln."
      },
      dashboard_camera: {
        label: "Kameravorschau in der Übersicht",
        description: "Fügt der Übersicht Live-Miniaturbilder der Kameras hinzu, die in einem festen Intervall aktualisiert werden. Die beiden eigenen Einstellungen darunter steuern, wo sie erscheinen und wie oft sie aktualisiert werden."
      },
      dashboard_camera_refresh: {
        label: "Aktualisierung der Kameravorschau (Sekunden)",
        description: "Legt fest, wie viele Sekunden zwischen zwei Aktualisierungen jedes Kamera-Miniaturbilds vergehen. Gilt nur, solange auch Kameravorschau in der Übersicht eingeschaltet ist."
      },
      dashboard_camera_section: {
        label: "Eigener Kameraabschnitt",
        description: "Fasst alle Kameras in einem eigenen Abschnitt \"Kameras\" oben in der Übersicht zusammen; ist sie ausgeschaltet, erscheint die Vorschau jeder Kamera überall dort, wo sonst der Statustext dieses Geräts steht. Gilt nur, solange auch Kameravorschau in der Übersicht eingeschaltet ist."
      },
      time_ago: {
        label: "Relative Zeitangaben",
        description: "Zeigt die Zeit der letzten Aktualisierung eines Geräts als relative Angabe wie \"vor 5 Minuten\" statt als reines Datum mit Uhrzeit."
      },
      fade_off_items: {
        label: "Ausgeschaltete Geräte abdunkeln",
        description: "Karten ausgeschalteter Geräte abdunkeln"
      },
      switch_instead_of_bigtext: {
        label: "Schalter statt Statustext",
        description: "Ersetzt den einfachen Ein/Aus-Statustext auf der Karte eines einfachen Schalters durch einen Regler, den du direkt umlegen kannst, ohne das Gerät zu öffnen."
      },
      switch_instead_of_bigtext_scenes: {
        label: "Schalter auch auf Szenariokarten",
        description: "Erweitert denselben Schieberegler auf Szenario- und Gruppenkarten. Gilt nur, solange auch die Option Schalter statt Statustext eingeschaltet ist."
      },
      wind_direction: {
        label: "Richtung des Windpfeils",
        description: "Domoticz meldet die Richtung, AUS der der Wind kommt, und der Pfeil zeigt normalerweise dorthin. Schalte dies ein, damit er in die Gegenrichtung zeigt, also dorthin, WOHIN der Wind weht. Die Kompassangabe (N, SW) bleibt immer die gemeldete. Betrifft nur die klassischen Bildsymbole; steht Settings > Icon style auf Glyphen, stammt der Pfeil aus Domoticz selbst und diese Einstellung bewirkt nichts."
      },
      icon_image: {
        label: "Gerätefotos statt Symbole",
        description: "Zeigt ein eigenes Foto als Kartensymbol eines Geräts anstelle seines normalen Ein/Aus-Symbols. Wird je Gerät mit dem Editor eingestellt, den diese Option einblendet."
      },
      card_min_width: {
        label: "Minimale Kartenbreite",
        description: "Legt in Pixeln fest, wie schmal eine Gerätekarte werden darf, bevor das Raster auf weniger Spalten umbricht."
      },
      card_max_width: {
        label: "Maximale Kartenbreite",
        description: "Legt in Pixeln fest, wie breit eine Gerätekarte höchstens werden darf, wenn in der Zeile Platz frei ist."
      },
      log_plot_bands: {
        label: "Bereichsbänder in Protokollgrafiken",
        description: "Zeichnet die farbigen Schwellenbänder aus dem Bar-Ranges-Dialog eines Geräts in das Diagramm seiner Protokollseite, wo Domoticz selbst sie nie zeichnet."
      },
      background_img: {
        label: "Hintergrundbild",
        description: "Legt das Bild fest, das als Seitenhintergrund dient. Gib eine Webadresse oder den Namen einer Bilddatei im images-Ordner des Designs an; lass das Feld leer für keinen Hintergrund."
      },
      background_type: {
        label: "Hintergrundart",
        description: "Wählt, wie das Hintergrundbild dargestellt wird: bildschirmfüllend gedehnt (Cover) oder in Originalgröße als Muster gekachelt."
      },
      logo: {
        label: "Eigenes Logo",
        description: "Legt ein anderes Bild als Logo der Navigationsleiste fest, anstelle des Standardlogos von Machinon. Gib den Namen einer Bilddatei im images-Ordner des Designs an."
      },
      hide_logo: {
        label: "Logo ausblenden",
        description: "Blendet das Logobild in der Navigationsleiste vollständig aus und lässt den Platz frei."
      },
      scheme: {
        label: "Farbschema",
        description: "Legt das gesamte Farbschema des Designs fest: eine helle oder dunkle Basis mit benannten Farbpaletten."
      },
      custom_color_scheme: {
        label: "Eigene Farben",
        description: "Erstellt dein eigenes Farbschema, indem du 7 einzelne Farben wählst."
      },
      iconpacks: {
        label: "Symbolbibliothek",
        description: "Durchsuche die Symbolbibliothek und installiere genau die Symbole, die du möchtest, auf einzelnen Geräten."
      },
      about: {
        label: "Über Machinon",
        description: "Version des Designs, Beschreibung, Danksagungen, Links und Wartungsaktionen"
      }
    },
    iconlib: {
      load_failed: "Symbolbibliothek in dieser Design-Installation nicht gefunden ({error}).",
      no_match: "Keine Symbole passen zur Suche.",
      installed_chip: "Installiert",
      install: "Installieren",
      installed_current: "Installiert und aktuell",
      update_available: "Update verfügbar: neu installieren",
      not_installed: "Nicht installiert",
      remove: "Entfernen",
      remove_confirm_used: "„{name}“ entfernen? Verwendet von: {users}. Diese Geräte erhalten wieder ihr Standardsymbol.",
      remove_confirm: "„{name}“ aus der Symboldatenbank entfernen?",
      counter: "{count} von {total} installiert",
      install_all: "Alle installieren / aktualisieren",
      install_shown: "Angezeigte installieren / aktualisieren ({count})"
    },
    appliesTo: {
      whole_ui: "Gesamte Oberfläche",
      navbar_badge: "Badge in der Navigationsleiste",
      toasts: "Meldungen",
      all_dialogs: "Alle Dialoge",
      color_light_devices: "Farblichter",
      page_footer: "Seitenfußzeile",
      floorplan: "Grundriss",
      setup_menu: "Einrichtungsmenü",
      navbar: "Navigationsleiste",
      navbar_new_page: "Navigationsleiste + neue Seite",
      desktop_layout: "Desktop-Layout",
      classic_dashboard: "Klassische Übersicht",
      all_device_pages: "Alle Geräteseiten",
      device_scene_cards: "Geräte- und Szenariokarten",
      wind_device_cards: "Windgerätekarten",
      device_cards: "Gerätekarten",
      all_card_grids: "Alle Kartenraster",
      device_log_charts: "Geräteprotokoll-Diagramme",
      device_icons: "Gerätesymbole",
      theme: "Design"
    },
    options: {
      background_type: {
        cover: "Cover",
        pattern: "Muster"
      },
      warn_repeat: {
        visit: "Einmal pro Besuch",
        daily: "Einmal am Tag",
        episode: "Nur bei Änderung"
      }
    },
    about: {
      aria: "Über dieses Design",
      title: "Machinon-Design V.{version}",
      short_description: "Ein modernes Domoticz-Design mit Farbschemata, Theme-Hub-Einstellungen, "
        + "aufgefrischten Symbolen sowie hellen und dunklen Varianten. Details und Wartung "
        + "findest du im Reiter Über.",
      description: "Machinon bringt eine eingebaute Symbolbibliothek mit mehr als 250 Symbolen "
        + "mit, die du durchsuchen und aus der du installieren kannst; die Symbole werden direkt "
        + "in die Domoticz-Gerätedatenbank geschrieben, sodass jedes installierte Symbol in der "
        + "Symbolauswahl jedes Geräts verfügbar ist und nicht nur auf den Karten dieses Designs. "
        + "Dieser Einstellungs-Hub übernimmt jede Änderung sofort mit Live-Vorschau, bietet helle "
        + "und dunkle Farbschemata sowie eine eigene Palette mit automatischer Kontrastprüfung, "
        + "und das Design selbst ist vollständig responsiv mit einem mobilen Layout, das auf "
        + "Telefonbildschirme passt.",
      contributions: "Mitwirkende",
      role_design: "Gestaltung",
      role_code: "Code",
      link_repo: "GitHub-Repository",
      link_wiki: "Wiki",
      icons8_credit: "Symbole von Icons8"
    },
    maintenance: {
      aria: "Design-Wartung",
      title: "Wartung",
      note: "Jede Aktion fragt zuerst nach einer Bestätigung.",
      reset_theme: "Design auf Standardwerte zurücksetzen",
      reset_theme_confirm: "Alle Design-Einstellungen auf ihre Standardwerte zurücksetzen? Dies löscht die gespeicherten Design-Einstellungen und lädt die Seite neu.",
      clear_cache: "Zwischengespeicherte Einstellungen löschen",
      clear_cache_confirm: "Die in diesem Browser zwischengespeicherten Design-Einstellungen löschen und neu laden? Deine auf dem Server gespeicherten Einstellungen bleiben erhalten.",
      reset_colors: "Farben auf das gewählte Schema zurücksetzen",
      reset_colors_confirm: "Die eigenen Farben auf die Standardpalette des gewählten Schemas zurücksetzen?",
      promote: "Meine aktuellen Einstellungen als Haus-Standard speichern",
      promote_confirm: "Deine aktuellen persönlichen Einstellungen über die Haus-Standardwerte kopieren? Deine eigenen Einstellungen bleiben deine; dies ändert, was neue Benutzer und Benutzer nach einem Zurücksetzen erhalten.",
      promote_done: "Haus-Standardwerte aktualisiert",
      reset_mine: "Meine persönlichen Einstellungen zurücksetzen",
      reset_mine_confirm: "Deine persönlichen Design-Einstellungen zurücksetzen? Du fällst auf die Haus-Standardwerte zurück.",
      reset_house: "Haus-Standardwerte zurücksetzen",
      reset_house_confirm: "Die HAUS-Standardwerte auf die Werkseinstellungen zurücksetzen? Die persönlichen Einstellungen der Benutzer bleiben unberührt.",
      reset_partial: "Ein Teil der Zurücksetzung ist erfolgt. Drücke erneut auf Zurücksetzen, um sie abzuschließen."
    },
    imageEditor: {
      help: "Ordnet einem Gerät (über die Idx) eine Bilddatei im images-Ordner des Designs zu. Funktioniert mit Lichtgeräten, die mit einem Glühbirnensymbol angezeigt werden.",
      idx_aria: "Geräte-Idx",
      idx_placeholder: "Idx",
      img_aria: "Name der Bilddatei",
      add: "Hinzufügen",
      empty: "Noch keine Gerätebilder.",
      idx_cell: "Idx {idx}",
      remove: "Entfernen",
      remove_aria: "Bild für Gerät {idx} entfernen"
    },
    schemes: {
      swatches: {
        background: "Hintergrund",
        navbar: "Menü",
        item: "Element",
        main_color: "Hauptfarbe",
        main_text: "Text",
        alt_text: "Sekundärtext",
        disabled: "Deaktiviert"
      },
      builtin: {
        light: { name: "Machinon Hell", desc: "Das Standardaussehen: klares Blau auf Weiß" },
        dark: { name: "Machinon Dunkel", desc: "Das Standardaussehen: leuchtendes Blau auf Marineblau" },
        custom: { name: "Benutzerdefiniert", desc: "Deine eigenen sieben Farben" }
      },
      delete_preset: "Voreinstellung löschen",
      wheel_aria: "{label} mit einem Farbkreis wählen",
      hex_aria: "Hex-Wert für {label}",
      save_preset: "Als Voreinstellung speichern",
      preset_name_prompt: "Name der Voreinstellung",
      light: "Hell",
      dark: "Dunkel",
      wcag_what_preset: "Voreinstellung \"{name}\" gespeichert, aber sie",
      wcag_what_custom: "Das eigene Farbschema",
      wcag_body: "Text auf Hintergrund {ratio}:1 (WCAG AA erfordert 4.5)",
      wcag_alt: "Sekundärtext {ratio}:1 (WCAG AA erfordert 4.5)",
      wcag_accent: "Text auf Akzentfarbe {ratio}:1 (erfordert 3.0)"
    },
    wizard: {
      aria: "Ein Design erstellen",
      title: "Ein Design erstellen",
      cancel: "Abbrechen",
      back: "Zurück",
      next: "Weiter",
      apply: "Übernehmen",
      save_theme: "Design speichern",
      steps: {
        colours: "Farben",
        look: "Aussehen",
        name: "Name"
      },
      name_label: "Name des Designs",
      name_placeholder: "Mein Design",
      tint_toggle: "Die Grautöne mit einer anderen Farbe einfärben",
      accent_label: "Hauptfarbe",
      surface_label: "Grauton",
      light: "Hell",
      dark: "Dunkel",
      drift_label: "Deine Farbe wurde angepasst, damit sie lesbar bleibt:",
      saved_lead: "Als zwei Schemata gespeichert, „{name} Hell“ und „{name} Dunkel“.",
      preview: {
        device: "Wohnzimmer",
        status: "21,4 °C · 47%",
        value: "Ein",
        device2: "Hintertür",
        status2: "Nicht verfügbar"
      },
      looks: {
        crisp: { label: "Klar", description: "Weiße Karten auf grauer Seite, mit sichtbaren Kanten" },
        soft: { label: "Weich", description: "Getönte Grautöne, Karten kaum von der Seite abgehoben, zarte Ränder" },
        deep: { label: "Tief", description: "Eine satt getönte Seite mit darüber schwebenden Karten" }
      },
      lead_colours: "Wähle deine Hauptfarbe. Alles andere wird daraus berechnet und auf Kontrast geprüft.",
      hint_colours: "Verwendet wird nur der Farbton, nicht der genaue Farbwert.",
      lead_look: "Wähle ein Aussehen. Jedes ist deine Farbe, nur anders angeordnet."
    }
  },
  toasts: {
    sensors_timed_out: "{count} Sensoren mit Zeitüberschreitung",
    devices_low_on_battery: "{count} Geräte mit schwacher Batterie",
    devices: "{count} Geräte",
    update_available: "Machinon-Version {version} ist verfügbar!",
    update_action: "Zum Herunterladen hier klicken",
    wcag_fails: "{what} besteht die WCAG-Kontrastprüfung nicht: {failures}",
    name_pipe: "Ein Designname darf das Zeichen | nicht enthalten.",
    wizard_name_first: "Gib deinem Design zuerst einen Namen.",
    wizard_unreadable: "Diese Kombination konnte nicht lesbar gemacht werden. Bitte melde das.",
    wizard_created: "„{name}“ erstellt.",
    icon_busy: "Ein anderer Symbolvorgang läuft noch",
    icon_installed: "{name} installiert",
    icon_install_failed: "{name}: {error}",
    icon_removed: "{name} entfernt",
    icon_remove_failed: "{name} konnte nicht entfernt werden",
    icon_usage_check_failed: "Es konnte nicht geprüft werden, welche Geräte {name} verwenden",
    icons_all_current: "Alle {count} Paketsymbole sind installiert und aktuell",
    icons_all_shown_current: "Alle {count} angezeigten Paketsymbole sind installiert und aktuell",
    icons_installing: "Installation {n}/{total}: {name}",
    icons_summary: "{added} installiert, {updated} aktualisiert, {current} bereits aktuell",
    icons_summary_failed: "{summary}; fehlgeschlagen: {failures}",
    save_failed: "Design-Einstellungen konnten nicht gespeichert werden ({error})",
    save_failed_local: "Design-Einstellungen konnten nicht in Domoticz gespeichert werden; sie bleiben nur in diesem Browser."
  }
};
