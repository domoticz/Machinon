// French. Machine-translated from the English template (lang/machinon.en.js);
// corrections welcome via pull request. The English file defines the key set.
language = {
  common: {
    and: "et",
    more: "autres",
    close: "Fermer"
  },
  header: {
    mainmenu: "Menu principal",
    type_to_search: "Tapez pour rechercher",
    search_placeholder: "Nom, Desc, Idx, Etat"
  },
  hub: {
    loading: "Chargement..",
    house_managed: "Réglage de la maison, géré par un administrateur",
    house_badge: "maison",
    reload_note: "Prend effet après rechargement",
    reload_now: "Recharger maintenant",
    groups: {
      general: "Général",
      menus: "Menus et barre de navigation",
      dashboard: "Accueil",
      cards: "Cartes des dispositifs",
      charts: "Graphiques et log",
      background: "Fond et image de marque",
      colors: "Couleurs et schémas",
      iconpacks: "Icônes",
      about: "À propos"
    },
    settings: {
      standby: {
        label: "Mise en veille de l'écran",
        description: "Après une période d'inactivité, toute la page s'estompe vers un écran d'horloge sombre; une touche ou un clic la ramène."
      },
      standby_after: {
        label: "Mise en veille après (minutes)",
        description: "Définit le nombre de minutes d'inactivité qui déclenchent la mise en veille de l'écran. Ne s'applique que si l'option « Mise en veille de l'écran » est également activée."
      },
      check_update: {
        label: "Avis de mise à jour",
        description: "Vérifie sur GitHub s'il existe une version plus récente du thème et affiche un avis le cas échéant. Indépendant de la vérification de mise à jour propre à Domoticz."
      },
      warn_timeout: {
        label: "Alertes de capteur sans réponse",
        description: "Affiche un message lorsqu'un capteur cesse de transmettre. L'icône d'avertissement à côté du nom du dispositif apparaît dans tous les cas."
      },
      warn_battery: {
        label: "Alertes de batterie faible",
        description: "Affiche un message lorsqu'un dispositif signale une batterie faible. L'icône d'avertissement à côté du nom du dispositif apparaît dans tous les cas."
      },
      warn_repeat: {
        label: "Fréquence de répétition des alertes",
        description: "À quelle fréquence un même dispositif peut vous alerter de nouveau: une fois par visite, une fois par jour, ou seulement lorsque le problème disparaît puis revient. L'icône d'avertissement à côté du nom du dispositif apparaît dans tous les cas."
      },
      center_popups: {
        label: "Centrer les fenêtres contextuelles",
        description: "Force chaque fenêtre contextuelle à une position centrée fixe, au lieu de l'endroit où Domoticz la placerait autrement."
      },
      rgbw_popup: {
        label: "Sélecteur de couleur Machinon",
        description: "Remplace le sélecteur de couleur de Domoticz par un sélecteur au style Machinon pour les lumières colorées."
      },
      footer_text_disabled: {
        label: "Masquer le texte de pied de page",
        description: "Masque la ligne de copyright que Domoticz affiche en bas de chaque page."
      },
      floorplan_popup_details: {
        label: "Fenêtres de plan extensibles",
        description: "Rétablit la flèche d'expansion sur les fenêtres de dispositif des plans (masquée par défaut), révélant les raccourcis Log et Notifications."
      },
      custom_settings_menu: {
        label: "Menu de configuration en grille de tuiles",
        description: "Remplace le menu déroulant Configuration par une grille pleine page de tuiles à icônes, une par page de réglages."
      },
      navbar_icons: {
        label: "Icônes de la barre de navigation",
        description: "Affiche la petite icône à côté du libellé de chaque élément de la barre de navigation. Masquée par défaut."
      },
      navbar_icons_text: {
        label: "Barre de navigation en icônes seules (masquer le texte)",
        description: "Masque le texte de chaque élément de la barre de navigation, ne laissant que son icône. Ne s'applique que si l'option « Icônes de la barre de navigation » est également activée."
      },
      custom_page_menu: {
        label: "Page de menu personnalisée",
        description: "Ajoute un élément supplémentaire à la barre de navigation qui charge une page web de votre choix à la place de la page Domoticz habituelle."
      },
      button_name: {
        label: "Nom du bouton de la page personnalisée",
        description: "Définit le texte du libellé sur le bouton de la page de menu personnalisée dans la barre de navigation. Ne s'applique que si l'option « Page de menu personnalisée » est également activée."
      },
      custom_url: {
        label: "URL de la page personnalisée",
        description: "Définit l'adresse que charge la page de menu personnalisée. Ne s'applique que si l'option « Page de menu personnalisée » est également activée."
      },
      sidemenu: {
        label: "Menu latéral sur ordinateur",
        description: "Fait passer les écrans d'ordinateur au même menu latéral repliable que les téléphones utilisent déjà, en remplacement de la barre de navigation horizontale du haut."
      },
      dashboard_show_last_update: {
        label: "Ligne du dernier contact sur les cartes d'accueil",
        description: "Affiche l'heure de dernière mise à jour de chaque dispositif sous forme d'une petite ligne sur sa carte d'accueil."
      },
      dashboard_columns: {
        label: "Disposition en colonnes sur les écrans larges",
        description: "Sur les écrans de 1200px et plus, les sections de l'accueil sont disposées en colonnes côte à côte au lieu d'être empilées sur toute la largeur."
      },
      dashboard_camera: {
        label: "Aperçus de caméra sur l'accueil",
        description: "Ajoute des vignettes de caméra en direct à l'accueil, actualisées à intervalle régulier. Ses deux réglages ci-dessous contrôlent où elles apparaissent et à quelle fréquence elles s'actualisent."
      },
      dashboard_camera_refresh: {
        label: "Actualisation des aperçus de caméra (secondes)",
        description: "Définit le nombre de secondes entre deux actualisations de chaque vignette de caméra. Ne s'applique que si l'option « Aperçus de caméra sur l'accueil » est également activée."
      },
      dashboard_camera_section: {
        label: "Section caméras dédiée",
        description: "Regroupe toutes les caméras dans leur propre section \"Caméras\" en haut de l'accueil; lorsqu'elle est désactivée, l'aperçu de chaque caméra apparaît à la place du texte d'état de ce dispositif partout où il figure. Ne s'applique que si l'option « Aperçus de caméra sur l'accueil » est également activée."
      },
      time_ago: {
        label: "Temps relatifs",
        description: "Affiche l'heure de dernière mise à jour d'un dispositif sous forme d'une expression relative comme \"il y a 5 minutes\" au lieu de la date et de l'heure brutes."
      },
      fade_off_items: {
        label: "Atténuer les dispositifs éteints",
        description: "Atténuer les cartes des dispositifs qui sont éteints"
      },
      switch_instead_of_bigtext: {
        label: "Interrupteurs au lieu du texte d'état",
        description: "Remplace le simple texte On/Off sur la carte d'un interrupteur simple par un curseur que vous pouvez basculer directement, sans ouvrir le dispositif."
      },
      switch_instead_of_bigtext_scenes: {
        label: "Interrupteurs aussi sur les cartes de scénario",
        description: "Étend le même curseur aux cartes Scénario et Groupe. Ne s'applique que si l'option « Interrupteurs au lieu du texte d'état » est également activée."
      },
      wind_direction: {
        label: "Sens de la flèche du vent",
        description: "Domoticz indique la direction D'OÙ vient le vent, et la flèche pointe normalement dans ce sens. Activez ceci pour la faire pointer dans le sens opposé, VERS où le vent souffle. Le libellé de la boussole (N, SO) reste toujours celui qui est rapporté. N'affecte que les icônes images classiques; avec Settings > Icon style réglé sur les glyphes, la flèche est celle de Domoticz et ce réglage ne fait rien."
      },
      icon_image: {
        label: "Photos de dispositif au lieu des icônes",
        description: "Affiche une photo personnalisée comme icône de carte d'un dispositif au lieu de son icône marche/arrêt habituelle. Se règle par dispositif avec l'éditeur que cette option fait apparaître."
      },
      card_min_width: {
        label: "Largeur minimale des cartes",
        description: "Définit en pixels la largeur la plus faible à laquelle une carte de dispositif peut se réduire avant que la grille ne passe à moins de colonnes."
      },
      card_max_width: {
        label: "Largeur maximale des cartes",
        description: "Définit en pixels la largeur la plus grande à laquelle une carte de dispositif peut s'étirer lorsqu'il reste de la place dans la rangée."
      },
      log_plot_bands: {
        label: "Bandes de plage dans les graphiques de log",
        description: "Trace les bandes de seuil colorées de la boîte de dialogue Bar Ranges d'un dispositif sur le graphique de sa page Log, là où Domoticz lui-même ne les trace jamais."
      },
      background_img: {
        label: "Image de fond",
        description: "Définit l'image utilisée comme fond de page. Indiquez une adresse web ou le nom d'un fichier image dans le dossier images du thème; laissez vide pour aucune image de fond."
      },
      background_type: {
        label: "Type de fond",
        description: "Choisit la façon dont l'image de fond est affichée: étirée pour remplir l'écran (cover), ou répétée à sa taille d'origine comme un motif."
      },
      logo: {
        label: "Logo personnalisé",
        description: "Définit une autre image à utiliser comme logo de la barre de navigation, à la place de celui de Machinon. Indiquez le nom d'un fichier image dans le dossier images du thème."
      },
      hide_logo: {
        label: "Masquer le logo",
        description: "Masque entièrement l'image du logo de la barre de navigation, laissant cet espace vide."
      },
      scheme: {
        label: "Schéma de couleurs",
        description: "Définit le schéma de couleurs global du thème: une base claire ou sombre, avec des palettes de couleurs nommées."
      },
      custom_color_scheme: {
        label: "Couleurs personnalisées",
        description: "Construit votre propre schéma de couleurs en choisissant 7 couleurs individuelles."
      },
      iconpacks: {
        label: "Bibliothèque d'icônes",
        description: "Parcourez la bibliothèque d'icônes et installez uniquement les icônes que vous voulez sur des dispositifs précis."
      },
      about: {
        label: "À propos de Machinon",
        description: "Version du thème, description, crédits, liens et actions de maintenance"
      }
    },
    iconlib: {
      load_failed: "Bibliothèque d'icônes introuvable dans cette installation du thème ({error}).",
      no_match: "Aucune icône ne correspond à la recherche.",
      installed_chip: "Installée",
      install: "Installer",
      installed_current: "Installée et à jour",
      update_available: "Mise à jour disponible: réinstaller",
      not_installed: "Non installée",
      remove: "Supprimer",
      counter: "{count} sur {total} installées",
      install_all: "Tout installer / mettre à jour",
      install_shown: "Installer / mettre à jour les icônes affichées ({count})"
    },
    appliesTo: {
      whole_ui: "Toute l'interface",
      navbar_badge: "Badge de la barre de navigation",
      toasts: "Messages contextuels",
      all_dialogs: "Toutes les boîtes de dialogue",
      color_light_devices: "Lumières colorées",
      page_footer: "Pied de page",
      floorplan: "Plans",
      setup_menu: "Menu Configuration",
      navbar: "Barre de navigation",
      navbar_new_page: "Barre de navigation + nouvelle page",
      desktop_layout: "Disposition sur ordinateur",
      classic_dashboard: "Accueil classique",
      all_device_pages: "Toutes les pages de dispositifs",
      device_scene_cards: "Cartes dispositif et scénario",
      wind_device_cards: "Cartes de dispositif vent",
      device_cards: "Cartes des dispositifs",
      all_card_grids: "Toutes les grilles de cartes",
      device_log_charts: "Graphiques de log des dispositifs",
      device_icons: "Icônes des dispositifs",
      theme: "Thème"
    },
    options: {
      background_type: {
        cover: "Cover",
        pattern: "Motif"
      },
      warn_repeat: {
        visit: "Une fois par visite",
        daily: "Une fois par jour",
        episode: "Seulement en cas de changement"
      }
    },
    about: {
      aria: "À propos de ce thème",
      title: "Thème Machinon V.{version}",
      short_description: "Un thème Domoticz moderne avec des schémas de couleurs, les réglages "
        + "du Theme Hub, des icônes rafraîchies et des variantes claire et sombre. Voir l'onglet "
        + "À propos pour les détails et la maintenance.",
      description: "Machinon embarque une bibliothèque de plus de 250 icônes à parcourir et à "
        + "installer, écrites directement dans la base de données des dispositifs de Domoticz, "
        + "si bien que chaque icône installée est disponible depuis le sélecteur d'icônes de "
        + "n'importe quel dispositif, et pas seulement sur les cartes de ce thème. Ce centre de "
        + "réglages applique chaque changement en direct avec un aperçu instantané, propose des "
        + "schémas de couleurs clairs et sombres ainsi qu'une palette personnalisée avec "
        + "vérification automatique du contraste, et le thème lui-même est entièrement adaptatif "
        + "avec une disposition mobile qui tient sur l'écran d'un téléphone.",
      contributions: "Contributions",
      role_design: "Conception",
      role_code: "Code",
      link_repo: "Dépôt GitHub",
      link_wiki: "Wiki",
      icons8_credit: "Icônes par Icons8"
    },
    maintenance: {
      aria: "Maintenance du thème",
      title: "Maintenance",
      note: "Chaque action demande d'abord une confirmation.",
      reset_theme: "Réinitialiser le thème aux valeurs par défaut",
      reset_theme_confirm: "Réinitialiser tous les réglages du thème à leurs valeurs par défaut ? Cela supprime les réglages de thème enregistrés et recharge la page.",
      clear_cache: "Effacer les réglages en cache",
      clear_cache_confirm: "Effacer les réglages de thème en cache de ce navigateur et recharger ? Vos réglages enregistrés sur le serveur sont conservés.",
      reset_colors: "Réinitialiser les couleurs au schéma sélectionné",
      reset_colors_confirm: "Réinitialiser les couleurs personnalisées à la palette par défaut du schéma sélectionné ?",
      promote: "Enregistrer mes préférences actuelles comme valeurs par défaut de la maison",
      promote_confirm: "Copier vos réglages personnels actuels par-dessus les valeurs par défaut de la maison ? Vos propres réglages restent les vôtres; cela change ce que reçoivent les nouveaux utilisateurs et les utilisateurs après une réinitialisation.",
      promote_done: "Valeurs par défaut de la maison mises à jour",
      reset_mine: "Réinitialiser mes réglages personnels",
      reset_mine_confirm: "Réinitialiser vos réglages de thème personnels ? Vous revenez aux valeurs par défaut de la maison.",
      reset_house: "Réinitialiser les valeurs par défaut de la maison",
      reset_house_confirm: "Réinitialiser les valeurs par défaut de la MAISON aux valeurs d'usine ? Les réglages personnels des utilisateurs ne sont pas touchés.",
      reset_partial: "Une partie de la réinitialisation est terminée. Appuyez de nouveau sur Réinitialiser pour la terminer."
    },
    imageEditor: {
      help: "Associe un dispositif (par son Idx) à un fichier image du dossier images du thème. Fonctionne avec les lumières affichées avec une icône d'ampoule.",
      idx_aria: "Idx du dispositif",
      idx_placeholder: "Idx",
      img_aria: "Nom du fichier image",
      add: "Ajouter",
      empty: "Aucune image de dispositif pour l'instant.",
      idx_cell: "Idx {idx}",
      remove: "Supprimer",
      remove_aria: "Supprimer l'image du dispositif {idx}"
    },
    schemes: {
      swatches: {
        background: "Fond",
        navbar: "Menu",
        item: "Élément",
        main_color: "Principale",
        main_text: "Texte",
        alt_text: "Texte secondaire",
        disabled: "Désactivé"
      },
      builtin: {
        light: { name: "Machinon Clair", desc: "L'aspect par défaut: un bleu net sur blanc" },
        dark: { name: "Machinon Sombre", desc: "L'aspect par défaut: du bleu lumineux sur bleu nuit" },
        custom: { name: "Personnalisé", desc: "Vos sept couleurs à vous" }
      },
      delete_preset: "Supprimer le préréglage",
      wheel_aria: "Choisir {label} avec une roue chromatique",
      hex_aria: "Valeur hex de {label}",
      save_preset: "Enregistrer comme préréglage",
      preset_name_prompt: "Nom du préréglage",
      light: "Clair",
      dark: "Sombre",
      wcag_what_preset: "Préréglage \"{name}\" enregistré, mais il",
      wcag_what_custom: "Le schéma de couleurs personnalisé",
      wcag_body: "texte sur fond {ratio}:1 (WCAG AA exige 4.5)",
      wcag_alt: "texte secondaire {ratio}:1 (WCAG AA exige 4.5)",
      wcag_accent: "texte sur couleur d'accent {ratio}:1 (exige 3.0)"
    },
    wizard: {
      aria: "Créer un thème",
      title: "Créer un thème",
      cancel: "Annuler",
      back: "Retour",
      next: "Suivant",
      apply: "Appliquer",
      save_theme: "Enregistrer le thème",
      steps: {
        colours: "Couleurs",
        look: "Aspect",
        name: "Nom"
      },
      name_label: "Nom du thème",
      name_placeholder: "Mon thème",
      tint_toggle: "Teinter les gris avec une autre couleur",
      accent_label: "Couleur principale",
      surface_label: "Teinte des gris",
      light: "Clair",
      dark: "Sombre",
      drift_label: "Votre couleur a été ajustée pour rester lisible:",
      saved_lead: "Enregistré en deux schémas, « {name} Clair » et « {name} Sombre ».",
      preview: {
        device: "Salon",
        status: "21,4 °C · 47%",
        value: "On",
        device2: "Porte arrière",
        status2: "Indisponible"
      },
      looks: {
        crisp: { label: "Net", description: "Des cartes blanches sur une page grise, avec des bords visibles" },
        soft: { label: "Doux", description: "Des gris teintés, des cartes à peine détachées de la page, des bordures discrètes" },
        deep: { label: "Profond", description: "Une page richement teintée avec des cartes qui flottent au-dessus" }
      },
      lead_colours: "Choisissez votre couleur principale. Tout le reste en est calculé, puis vérifié pour le contraste.",
      hint_colours: "Seule la teinte est utilisée, pas la nuance exacte.",
      lead_look: "Choisissez un aspect. Chacun est votre couleur, disposée différemment."
    }
  },
  toasts: {
    sensors_timed_out: "{count} capteurs ont expiré",
    devices_low_on_battery: "{count} dispositifs à batterie faible",
    devices: "{count} dispositifs",
    update_available: "La version {version} de Machinon est disponible !",
    update_action: "Cliquez ici pour télécharger",
    wcag_fails: "{what} échoue au contraste WCAG: {failures}",
    name_pipe: "Un nom de thème ne peut pas contenir le caractère |.",
    wizard_name_first: "Donnez d'abord un nom à votre thème.",
    wizard_unreadable: "Cette combinaison n'a pas pu être rendue lisible. Merci de le signaler.",
    wizard_created: "« {name} » créé.",
    icon_busy: "Une autre opération sur les icônes est encore en cours",
    icon_installed: "{name} installée",
    icon_install_failed: "{name}: {error}",
    icon_removed: "{name} supprimée",
    icon_remove_failed: "Impossible de supprimer {name}",
    icon_usage_check_failed: "Impossible de vérifier quels dispositifs utilisent {name}",
    icons_all_current: "Les {count} icônes du paquet sont toutes installées et à jour",
    icons_all_shown_current: "Les {count} icônes affichées du paquet sont toutes installées et à jour",
    icons_installing: "Installation {n}/{total}: {name}",
    icons_summary: "{added} installées, {updated} mises à jour, {current} déjà à jour",
    icons_summary_failed: "{summary}; échecs: {failures}",
    save_failed: "Les réglages du thème n'ont pas pu être enregistrés ({error})",
    save_failed_local: "Les réglages du thème n'ont pas pu être enregistrés dans Domoticz; ils sont conservés uniquement dans ce navigateur."
  }
};
