// Polish. Machine-translated from the English template (lang/machinon.en.js);
// corrections welcome via pull request. The English file defines the key set.
language = {
  common: {
    and: "i",
    more: "więcej",
    close: "Zamknij"
  },
  header: {
    mainmenu: "Menu główne",
    type_to_search: "Wpisz, aby wyszukać",
    search_placeholder: "Nazwa, Opis, Idx, Status"
  },
  hub: {
    loading: "Wczytywanie..",
    house_managed: "Ustawienie domu, zarządzane przez administratora",
    house_badge: "dom",
    reload_note: "Działa po ponownym wczytaniu",
    reload_now: "Wczytaj ponownie",
    groups: {
      // "Generalne" matches core Domoticz pl; do not "fix" it to "Ogolne"/"Ogolny".
      general: "Generalne",
      menus: "Menu i pasek nawigacji",
      dashboard: "Pulpit",
      cards: "Karty urządzeń",
      charts: "Wykresy i logi",
      background: "Tło i logo",
      colors: "Kolory i schematy",
      iconpacks: "Ikony",
      about: "O motywie"
    },
    settings: {
      standby: {
        label: "Wygaszanie ekranu",
        description: "Po okresie bezczynności cała strona przygasa do ciemnego ekranu z zegarem; dowolne dotknięcie lub kliknięcie ją przywraca."
      },
      standby_after: {
        label: "Wygaszanie po (minutach)",
        description: "Określa, po ilu minutach bezczynności włącza się wygaszanie ekranu. Działa tylko wtedy, gdy Wygaszanie ekranu jest również włączone."
      },
      check_update: {
        label: "Powiadomienie o aktualizacji",
        description: "Sprawdza w serwisie GitHub, czy jest nowsza wersja motywu, i wyświetla powiadomienie, jeśli taka istnieje. Działa niezależnie od sprawdzania aktualizacji aplikacji przez samego Domoticza."
      },
      warn_timeout: {
        label: "Ostrzeżenia o przekroczeniu limitu czasu czujnika",
        description: "Wyświetla komunikat, gdy czujnik przestaje raportować. Ikona ostrzeżenia obok nazwy urządzenia pojawia się i tak."
      },
      warn_battery: {
        label: "Ostrzeżenia o niskim poziomie baterii",
        description: "Wyświetla komunikat, gdy urządzenie zgłasza niski poziom baterii. Ikona ostrzeżenia obok nazwy urządzenia pojawia się i tak."
      },
      warn_repeat: {
        label: "Jak często powtarzają się ostrzeżenia",
        description: "Jak często to samo urządzenie może ostrzec Cię ponownie: raz na wizytę, raz dziennie lub tylko wtedy, gdy problem znika i wraca. Ikona ostrzeżenia obok nazwy urządzenia pojawia się i tak."
      },
      center_popups: {
        label: "Wyśrodkuj okna wyskakujące",
        description: "Wymusza stałą, wyśrodkowaną pozycję każdego okna wyskakującego, zamiast miejsca, w którym umieściłby je Domoticz."
      },
      rgbw_popup: {
        label: "Próbnik kolorów Machinon",
        description: "Zastępuje wbudowany próbnik kolorów Domoticza próbnikiem w stylu Machinon dla kolorowych świateł."
      },
      footer_text_disabled: {
        label: "Ukryj tekst stopki",
        description: "Ukrywa wiersz praw autorskich, który Domoticz wyświetla na dole każdej strony."
      },
      floorplan_popup_details: {
        label: "Rozwijane okna planu pomieszczeń",
        description: "Przywraca strzałkę rozwijania w oknach urządzeń na planie pomieszczeń (domyślnie ukrytą), odsłaniając skróty Logi i Powiadomienia."
      },
      custom_settings_menu: {
        label: "Menu konfiguracji jako siatka kafelków",
        description: "Zastępuje rozwijane menu Konfiguracja pełnoekranową siatką kafelków z ikonami, po jednym na każdą stronę ustawień."
      },
      navbar_icons: {
        label: "Ikony na pasku nawigacji",
        description: "Wyświetla małą ikonę obok etykiety każdej pozycji paska nawigacji. Domyślnie ukryte."
      },
      navbar_icons_text: {
        label: "Pasek nawigacji tylko z ikonami (ukryj tekst)",
        description: "Ukrywa tekst każdej pozycji paska nawigacji, pozostawiając samą ikonę. Działa tylko wtedy, gdy Ikony na pasku nawigacji są również włączone."
      },
      custom_page_menu: {
        label: "Własna strona w menu",
        description: "Dodaje do paska nawigacji dodatkową pozycję, która wczytuje wybraną przez Ciebie stronę internetową zamiast zwykłej strony Domoticza."
      },
      button_name: {
        label: "Nazwa przycisku własnej strony",
        description: "Ustawia tekst etykiety przycisku własnej strony na pasku nawigacji. Działa tylko wtedy, gdy Własna strona w menu jest również włączona."
      },
      custom_url: {
        label: "Adres URL własnej strony",
        description: "Ustawia adres, który wczytuje własna strona w menu. Działa tylko wtedy, gdy Własna strona w menu jest również włączona."
      },
      sidemenu: {
        label: "Menu boczne na komputerze",
        description: "Przełącza ekrany komputerowe na to samo zwijane menu boczne, którego używają już telefony, zamiast poziomego paska nawigacji u góry."
      },
      dashboard_show_last_update: {
        label: "Wiersz Ostatnio widziany na kartach pulpitu",
        description: "Wyświetla czas ostatniej aktualizacji każdego urządzenia jako mały wiersz na jego karcie pulpitu."
      },
      dashboard_columns: {
        label: "Układ kolumnowy na szerokich ekranach",
        description: "Na ekranach o szerokości 1200px i większej sekcje pulpitu są układane obok siebie w kolumnach, zamiast jedna pod drugą na całej szerokości."
      },
      dashboard_camera: {
        label: "Podglądy kamer na pulpicie",
        description: "Dodaje do pulpitu miniatury obrazu z kamer na żywo, odświeżane w stałym odstępie czasu. Dwa własne ustawienia poniżej decydują, gdzie się pojawiają i jak często się odświeżają."
      },
      dashboard_camera_refresh: {
        label: "Odświeżanie podglądu kamery (sekundy)",
        description: "Określa, ile sekund mija między odświeżeniami każdej miniatury kamery. Działa tylko wtedy, gdy Podglądy kamer na pulpicie są również włączone."
      },
      dashboard_camera_section: {
        label: "Osobna sekcja kamer",
        description: "Grupuje wszystkie kamery we własnej sekcji \"Kamery\" u góry pulpitu; po wyłączeniu podgląd każdej kamery pojawia się w miejscu tekstu stanu tego urządzenia, wszędzie tam, gdzie ono występuje. Działa tylko wtedy, gdy Podglądy kamer na pulpicie są również włączone."
      },
      time_ago: {
        label: "Czas względny",
        description: "Wyświetla czas ostatniej aktualizacji urządzenia jako zwrot względny, na przykład \"5 minut temu\", zamiast surowej daty i godziny."
      },
      fade_off_items: {
        label: "Przygaszaj wyłączone urządzenia",
        description: "Przygaszaj karty urządzeń, które są wyłączone"
      },
      switch_instead_of_bigtext: {
        label: "Przełączniki zamiast tekstu stanu",
        description: "Zastępuje zwykły tekst stanu Wł./Wył. na karcie prostego przełącznika suwakiem, który możesz przestawić bezpośrednio, bez otwierania urządzenia."
      },
      switch_instead_of_bigtext_scenes: {
        label: "Przełączniki także na kartach scen",
        description: "Rozszerza ten sam suwak na karty scen i grup. Działa tylko wtedy, gdy Przełączniki zamiast tekstu stanu są również włączone."
      },
      wind_direction: {
        label: "Kierunek strzałki wiatru",
        description: "Domoticz podaje kierunek, Z którego wieje wiatr, i strzałka normalnie wskazuje właśnie ten kierunek. Włącz tę opcję, aby wskazywała w przeciwną stronę, czyli DOKĄD wieje wiatr. Etykieta kompasu (N, SW) zawsze pozostaje tą zgłoszoną. Dotyczy tylko klasycznych ikon obrazkowych; gdy w Settings > Icon style wybrano glify, strzałka pochodzi z samego Domoticza i to ustawienie nic nie zmienia."
      },
      icon_image: {
        label: "Zdjęcia urządzeń zamiast ikon",
        description: "Wyświetla własne zdjęcie jako ikonę karty urządzenia zamiast zwykłej ikony wł./wył. Ustawiane dla każdego urządzenia w edytorze, który ta opcja odsłania."
      },
      card_min_width: {
        label: "Minimalna szerokość karty",
        description: "Określa w pikselach, do jakiej najmniejszej szerokości może się zmniejszyć karta urządzenia, zanim siatka przejdzie na mniejszą liczbę kolumn."
      },
      card_max_width: {
        label: "Maksymalna szerokość karty",
        description: "Określa w pikselach, do jakiej największej szerokości może się rozciągnąć karta urządzenia, gdy w wierszu zostaje wolne miejsce."
      },
      log_plot_bands: {
        label: "Pasma zakresów na wykresach logów",
        description: "Rysuje kolorowe pasma progowe z okna Bar Ranges urządzenia na wykresie jego strony Logi, gdzie sam Domoticz nigdy ich nie rysuje."
      },
      background_img: {
        label: "Obraz tła",
        description: "Ustawia obraz używany jako tło strony. Podaj adres internetowy lub nazwę pliku graficznego w folderze images motywu; pozostaw puste, aby nie było obrazu tła."
      },
      background_type: {
        label: "Typ tła",
        description: "Wybiera sposób wyświetlania obrazu tła: rozciągnięty na cały ekran (cover) lub powielany w oryginalnym rozmiarze jako wzór."
      },
      logo: {
        label: "Własne logo",
        description: "Ustawia inny obraz jako logo paska nawigacji, zamiast domyślnego logo Machinon. Podaj nazwę pliku graficznego w folderze images motywu."
      },
      hide_logo: {
        label: "Ukryj logo",
        description: "Całkowicie ukrywa obraz logo na pasku nawigacji, pozostawiając to miejsce puste."
      },
      scheme: {
        label: "Schemat kolorów",
        description: "Ustawia ogólny schemat kolorów motywu: jasną lub ciemną podstawę wraz z nazwanymi paletami kolorów."
      },
      custom_color_scheme: {
        label: "Własne kolory",
        description: "Tworzy Twój własny schemat kolorów przez wybranie 7 pojedynczych kolorów."
      },
      iconpacks: {
        label: "Biblioteka ikon",
        description: "Przeglądaj bibliotekę ikon i instaluj na poszczególnych urządzeniach dokładnie te ikony, które chcesz."
      },
      about: {
        label: "O Machinon",
        description: "Wersja motywu, opis, podziękowania, odnośniki i czynności konserwacyjne"
      }
    },
    iconlib: {
      load_failed: "Nie znaleziono biblioteki ikon w tej instalacji motywu ({error}).",
      no_match: "Żadna ikona nie pasuje do wyszukiwania.",
      installed_chip: "Zainstalowana",
      install: "Zainstaluj",
      installed_current: "Zainstalowana i aktualna",
      update_available: "Dostępna aktualizacja: zainstaluj ponownie",
      not_installed: "Niezainstalowana",
      remove: "Usuń",
      counter: "{count} z {total} zainstalowanych",
      install_all: "Zainstaluj / zaktualizuj wszystkie",
      install_shown: "Zainstaluj / zaktualizuj wyświetlone ({count})"
    },
    appliesTo: {
      whole_ui: "Cały interfejs",
      navbar_badge: "Znacznik na pasku nawigacji",
      toasts: "Komunikaty wyskakujące",
      all_dialogs: "Wszystkie okna",
      color_light_devices: "Kolorowe światła",
      page_footer: "Stopka strony",
      floorplan: "Plan pomieszczeń",
      setup_menu: "Menu Konfiguracja",
      navbar: "Pasek nawigacji",
      navbar_new_page: "Pasek nawigacji + nowa strona",
      desktop_layout: "Układ na komputerze",
      classic_dashboard: "Klasyczny pulpit",
      all_device_pages: "Wszystkie strony urządzeń",
      device_scene_cards: "Karty urządzeń i scen",
      wind_device_cards: "Karty urządzeń wiatru",
      device_cards: "Karty urządzeń",
      all_card_grids: "Wszystkie siatki kart",
      device_log_charts: "Wykresy logów urządzeń",
      device_icons: "Ikony urządzeń",
      theme: "Motyw"
    },
    options: {
      background_type: {
        cover: "Cover",
        pattern: "Wzór"
      },
      warn_repeat: {
        visit: "Raz na wizytę",
        daily: "Raz dziennie",
        episode: "Tylko przy zmianie"
      }
    },
    about: {
      aria: "O tym motywie",
      title: "Motyw Machinon V.{version}",
      short_description: "Nowoczesny motyw Domoticza ze schematami kolorów, ustawieniami Theme "
        + "Hub, odświeżonymi ikonami oraz wariantami jasnym i ciemnym. Szczegóły i konserwacja "
        + "znajdują się w zakładce O motywie.",
      description: "Machinon zawiera wbudowaną bibliotekę ponad 250 ikon, którą można przeglądać "
        + "i z której instaluje się ikony zapisywane bezpośrednio w bazie urządzeń Domoticza, "
        + "dzięki czemu każda zainstalowana ikona jest dostępna w wyborze ikon dowolnego "
        + "urządzenia, a nie tylko na kartach tego motywu. To centrum ustawień stosuje każdą "
        + "zmianę na żywo z natychmiastowym podglądem, oferuje jasne i ciemne schematy kolorów "
        + "oraz własną paletę z automatycznym sprawdzaniem kontrastu, a sam motyw jest w pełni "
        + "responsywny i ma układ mobilny dopasowany do ekranów telefonów.",
      contributions: "Współtwórcy",
      role_design: "Projekt",
      role_code: "Kod",
      link_repo: "Repozytorium GitHub",
      link_wiki: "Wiki",
      icons8_credit: "Ikony od Icons8"
    },
    maintenance: {
      aria: "Konserwacja motywu",
      title: "Konserwacja",
      note: "Każda czynność najpierw prosi o potwierdzenie.",
      reset_theme: "Przywróć domyślne ustawienia motywu",
      reset_theme_confirm: "Przywrócić wszystkie ustawienia motywu do wartości domyślnych? Spowoduje to usunięcie zapisanych ustawień motywu i ponowne wczytanie strony.",
      clear_cache: "Wyczyść ustawienia z pamięci podręcznej",
      clear_cache_confirm: "Wyczyścić ustawienia motywu z pamięci podręcznej tej przeglądarki i wczytać stronę ponownie? Ustawienia zapisane na serwerze pozostaną nienaruszone.",
      reset_colors: "Przywróć kolory wybranego schematu",
      reset_colors_confirm: "Przywrócić własne kolory do domyślnej palety wybranego schematu?",
      promote: "Zapisz moje bieżące preferencje jako domyślne dla domu",
      promote_confirm: "Skopiować Twoje bieżące ustawienia osobiste na ustawienia domyślne dla domu? Twoje własne ustawienia pozostaną Twoje; zmienia się to, co otrzymują nowi użytkownicy oraz użytkownicy po zresetowaniu.",
      promote_done: "Zaktualizowano ustawienia domyślne dla domu",
      reset_mine: "Zresetuj moje ustawienia osobiste",
      reset_mine_confirm: "Zresetować Twoje osobiste ustawienia motywu? Wrócisz do ustawień domyślnych dla domu.",
      reset_house: "Zresetuj ustawienia domyślne dla domu",
      reset_house_confirm: "Przywrócić ustawienia domyślne DLA DOMU do wartości fabrycznych? Osobiste ustawienia użytkowników pozostaną nienaruszone.",
      reset_partial: "Część przywracania została wykonana. Naciśnij ponownie Przywróć domyślne ustawienia motywu, aby dokończyć."
    },
    imageEditor: {
      help: "Przypisuje urządzenie (po Idx) do pliku graficznego w folderze images motywu. Działa ze światłami wyświetlanymi z ikoną żarówki.",
      idx_aria: "Idx urządzenia",
      idx_placeholder: "Idx",
      img_aria: "Nazwa pliku graficznego",
      add: "Dodaj",
      empty: "Brak obrazów urządzeń.",
      idx_cell: "Idx {idx}",
      remove: "Usuń",
      remove_aria: "Usuń obraz urządzenia {idx}"
    },
    schemes: {
      swatches: {
        background: "Tło",
        navbar: "Menu",
        item: "Element",
        main_color: "Główny",
        main_text: "Tekst",
        alt_text: "Tekst pomocniczy",
        disabled: "Wyłączone"
      },
      builtin: {
        light: { name: "Machinon Jasny", desc: "Wygląd domyślny: czysty błękit na bieli" },
        dark: { name: "Machinon Ciemny", desc: "Wygląd domyślny: błękit świecący na granacie" },
        custom: { name: "Własny", desc: "Twoich siedem kolorów" }
      },
      delete_preset: "Usuń zestaw",
      wheel_aria: "Wybierz {label} za pomocą koła kolorów",
      hex_aria: "Wartość hex dla {label}",
      save_preset: "Zapisz jako zestaw",
      preset_name_prompt: "Nazwa zestawu",
      light: "Jasny",
      dark: "Ciemny",
      wcag_what_preset: "Zestaw \"{name}\" zapisany, ale",
      wcag_what_custom: "Własny schemat kolorów",
      wcag_body: "tekst na tle {ratio}:1 (WCAG AA wymaga 4.5)",
      wcag_alt: "tekst pomocniczy {ratio}:1 (WCAG AA wymaga 4.5)",
      wcag_accent: "tekst na kolorze akcentu {ratio}:1 (wymaga 3.0)"
    },
    wizard: {
      aria: "Utwórz motyw",
      title: "Utwórz motyw",
      cancel: "Anuluj",
      back: "Wstecz",
      next: "Dalej",
      apply: "Zastosuj",
      save_theme: "Zapisz motyw",
      steps: {
        colours: "Kolory",
        look: "Wygląd",
        name: "Nazwa"
      },
      name_label: "Nazwa motywu",
      name_placeholder: "Mój motyw",
      tint_toggle: "Zabarw szarości innym kolorem",
      accent_label: "Kolor główny",
      surface_label: "Odcień szarości",
      light: "Jasny",
      dark: "Ciemny",
      drift_label: "Twój kolor został dostosowany, aby pozostał czytelny:",
      saved_lead: "Zapisano jako dwa schematy, „{name} Jasny” i „{name} Ciemny”.",
      preview: {
        device: "Salon",
        status: "21,4 °C · 47%",
        value: "Wł.",
        device2: "Tylne drzwi",
        status2: "Niedostępne"
      },
      looks: {
        crisp: { label: "Wyrazisty", description: "Białe karty na szarej stronie, z widocznymi krawędziami" },
        soft: { label: "Miękki", description: "Zabarwione szarości, karty ledwie odstające od strony, subtelne obramowania" },
        deep: { label: "Głęboki", description: "Mocno zabarwiona strona z kartami unoszącymi się nad nią" }
      },
      lead_colours: "Wybierz swój kolor główny. Cała reszta jest z niego wyliczana i sprawdzana pod kątem kontrastu.",
      hint_colours: "Używana jest tylko barwa, a nie dokładny odcień.",
      lead_look: "Wybierz wygląd. Każdy z nich to Twój kolor, tylko inaczej rozłożony."
    }
  },
  toasts: {
    sensors_timed_out: "{count} czujników przekroczyło limit czasu",
    devices_low_on_battery: "{count} urządzeń ma niski poziom baterii",
    devices: "{count} urządzeń",
    update_available: "Dostępna jest wersja {version} motywu Machinon!",
    update_action: "Kliknij tutaj, aby pobrać",
    wcag_fails: "{what} nie spełnia wymagań kontrastu WCAG: {failures}",
    name_pipe: "Nazwa motywu nie może zawierać znaku |.",
    wizard_name_first: "Najpierw nadaj motywowi nazwę.",
    wizard_unreadable: "Nie udało się uczynić tej kombinacji czytelną. Prosimy o zgłoszenie tego.",
    wizard_created: "Utworzono „{name}”.",
    icon_busy: "Trwa jeszcze inna operacja na ikonach",
    icon_installed: "Zainstalowano {name}",
    icon_install_failed: "{name}: {error}",
    icon_removed: "Usunięto {name}",
    icon_remove_failed: "Nie udało się usunąć {name}",
    icon_usage_check_failed: "Nie udało się sprawdzić, które urządzenia używają {name}",
    icons_all_current: "Wszystkie {count} ikon z pakietu są zainstalowane i aktualne",
    icons_all_shown_current: "Wszystkie {count} wyświetlonych ikon z pakietu są zainstalowane i aktualne",
    icons_installing: "Instalowanie {n}/{total}: {name}",
    icons_summary: "{added} zainstalowanych, {updated} zaktualizowanych, {current} już aktualnych",
    icons_summary_failed: "{summary}; nieudane: {failures}",
    save_failed: "Nie udało się zapisać ustawień motywu ({error})",
    save_failed_local: "Nie udało się zapisać ustawień motywu w Domoticzu; zostały zachowane tylko w tej przeglądarce."
  }
};
