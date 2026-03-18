# Domoticz Theming Guide

> Comprehensive reference for creating Domoticz themes.
> Based on Domoticz v2025.2 (build 17399), development branch.
> Last validated: 2026-03-16

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Theme File Structure](#2-theme-file-structure)
3. [How Theme Loading Works](#3-how-theme-loading-works)
4. [CSS Load Order & Specificity](#4-css-load-order--specificity)
5. [The Legacy Compatibility Layer](#5-the-legacy-compatibility-layer)
6. [Application Layout & Grid System](#6-application-layout--grid-system)
7. [Navigation Bar](#7-navigation-bar)
8. [Dashboard Page](#8-dashboard-page)
9. [Device Cards — Common Structure](#9-device-cards--common-structure)
10. [Light/Switch Widget](#10-lightswitch-widget)
11. [Temperature Cards](#11-temperature-cards)
12. [Weather Cards](#12-weather-cards)
13. [Utility Widget](#13-utility-widget)
14. [Scene/Group Widget](#14-scenegroup-widget)
15. [Settings & Setup Pages](#15-settings--setup-pages)
16. [Login Page](#16-login-page)
17. [Floorplans](#17-floorplans)
18. [Modals & Dialogs](#18-modals--dialogs)
19. [Charts (Highcharts)](#19-charts-highcharts)
20. [Notifications (Noty)](#20-notifications-noty)
21. [Data Tables](#21-data-tables)
22. [Form Controls](#22-form-controls)
23. [Status Classes](#23-status-classes)
24. [Drag & Drop](#24-drag--drop)
25. [Mobile & Responsive](#25-mobile--responsive)
26. [CSS Custom Properties](#26-css-custom-properties)
27. [Theme JavaScript (custom.js)](#27-theme-javascript-customjs)
28. [Complete Route Map](#28-complete-route-map)
29. [Selector Reference](#29-selector-reference)
30. [Golden Rules for Theme Authors](#30-golden-rules-for-theme-authors)

---

## 1. Architecture Overview

Domoticz is a single-page application (SPA) built with:

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend framework | AngularJS | 1.x |
| Module loader | Require.js (AMD) | — |
| Router | ngRoute (hash-based) | — |
| CSS framework | Bootstrap | 2.3.0 |
| UI widgets | jQuery UI | 1.x (ui-darkness theme) |
| Charts | Highcharts | — |
| Icons | Font Awesome | 6 (Free, solid) |
| Grid | Bootstrap 2 float grid | `.span3`, `.span4`, `.row-fluid` |
| Build system | **None** | All raw CSS/JS, no preprocessing |

**Key architectural facts:**

- There is **no build pipeline** — themes are plain CSS/JS files served as-is
- The application uses **table-based device card layouts** (not CSS grid/flexbox)
- AngularJS owns the DOM — widgets are Angular directives with `replace: true`
- Angular may re-render widget DOM at any time (digest cycles, `$watch`, `$timeout`, `element.i18n()`)
- Themes load **last** in the CSS cascade, giving them override power over everything

---

## 2. Theme File Structure

Themes live in `www/styles/<theme-name>/`. The minimum required files:

```
styles/
└── my-theme/
    ├── custom.css          # Required — your theme's CSS entry point
    └── custom.js           # Required — your theme's JavaScript (can be empty)
```

Optional additional files:

```
styles/
└── my-theme/
    ├── custom.css
    ├── custom.js
    ├── base.css            # Modular: core variables and layout
    ├── extras.css          # Modular: animations, effects
    ├── fonts/              # Custom web fonts
    └── images/             # Theme-specific images
```

### custom.css

This is the entry point. It can either contain all styles inline, or use `@import` to compose from modules:

```css
/* Option A: Import legacy + modular files */
@import url("../../css/legacy.css");   /* Required for backward compat */
@import url("base.css");
@import url("extras.css");

/* Option B: Everything in one file (import legacy first) */
@import url("../../css/legacy.css");

body { background: #1a1a2e; color: #eee; }
/* ... all other rules ... */
```

### custom.js

Runs after all other JS has loaded. Primary use case: configuring Highcharts colors. Can also manipulate DOM via jQuery, though CSS-only approaches are preferred.

```javascript
// Minimal custom.js — configure chart colors for your theme
if (typeof Highcharts !== 'undefined') {
    Highcharts.setOptions({
        chart: { backgroundColor: 'transparent' },
        title: { style: { color: '#c0cfe0' } },
        // ... see Section 19 for full reference
    });
}
```

---

## 3. How Theme Loading Works

Understanding this mechanism is critical. It's **server-side URI rewriting**, not client-side.

### The flow:

1. **index.html hardcodes** paths to the default theme:
   ```html
   <!-- Line 98 -->
   <link rel="stylesheet" href="styles/default/custom.css">
   <!-- Line 136 -->
   <script src="styles/default/custom.js"></script>
   ```

2. **User selects a theme** in Settings → the backend stores it in the database and updates an in-memory variable (`m_actTheme`).

3. **On page reload**, when the browser requests `styles/default/custom.css`, the **C++ web server intercepts** the request:
   ```
   Request:  /styles/default/custom.css
   Rewrite:  /styles/<selected-theme>/custom.css  (if file exists)
   Fallback: /styles/default/custom.css           (if theme file missing)
   ```

4. The same rewriting applies to **any file** under `/styles/` — so `styles/default/images/foo.png` will be rewritten to `styles/<theme>/images/foo.png` if it exists.

### Implications:

- Your theme **must** provide `custom.css` and `custom.js` at minimum
- You can reference assets relative to your theme folder: `url("images/bg.png")` will resolve correctly
- There is **no hot-reload** — theme changes require a full page reload
- The rewriting logic is in `extern/libwebem/src/cWebem.cpp` (lines 2527-2544)

---

## 4. CSS Load Order & Specificity

Files load in this exact order. Later files override earlier ones at equal specificity.

| # | File | Purpose | Rules |
|---|------|---------|-------|
| 1 | `css/bootstrap.css` | Grid, typography, buttons, navbar (v2.3.0) | 826 |
| 2 | `css/bootstrap-responsive.css` | Responsive breakpoints | 20 |
| 3 | `css/ui-darkness/jquery-ui.min.css` | jQuery UI widgets (dialogs, sliders, etc.) | 375 |
| 4 | `css/ui-grid.min.css` | Angular UI Grid | 226 |
| 5 | `css/demo_table_jui.css` | DataTables jQuery UI integration | 81 |
| 6 | `css/jquery.uix.multiselect.css` | Multi-select widget | 22 |
| 7 | `font-awesome/css/fontawesome.min.css` | Font Awesome base | 1455 |
| 8 | `font-awesome/css/solid.min.css` | Font Awesome solid icons | 3 |
| 9 | `css/style.css` | **Main application styles** (2978 lines) | 427 |
| 10 | `css/weather.css` | Weather-specific card styles | 70 |
| 11 | `css/colpick.css` | Color picker | 67 |
| 12 | `css/jquery-ui-timepicker-addon.css` | Timepicker addon | 10 |
| 13 | `css/remote.css` | Remote control SVG styling | 6 |
| 14 | `css/wheelcolorpicker.css` | Wheel color picker | 15 |
| 15 | `js/noty/noty.css` | Notification toasts | 35 |
| 16 | `js/noty/relax.css` | Noty theme variant | 12 |
| 17 | `app/events/Events.css` | Events editor page | 53 |
| 18 | `app/devices/Devices.css` | Devices management page | 11 |
| 19 | **`styles/<theme>/custom.css`** | **YOUR THEME — overrides everything** | — |

**Specificity strategy:** Your theme loads last, so at equal specificity you win. For high-specificity upstream selectors (e.g., `SECTION.dashCategory .row` at (0,2,1)), you may need to match or exceed their specificity.

---

## 5. The Legacy Compatibility Layer

**File:** `css/legacy.css` (1064 lines)

The default theme imports this file, and themes that want backward compatibility should too:
```css
@import url("../../css/legacy.css");
```

### What legacy.css provides:

1. **Mobile-first table layouts** — transforms `<table>` device cards into stacked block layouts for small screens
2. **Status-colored name cells** — `.statusNormal`, `.statusTimeout`, `.statusProtected`, etc.
3. **Widget directive display fix** — `dz-light-widget, dz-scene-widget, dz-utility-widget { display: contents }`
4. **Brand/logo positioning** — `.brand h1`, `.brand h2`, `.brand img`
5. **Selector level button styling** — `.selectorlevels` button sizes
6. **ZWave label styling** — `.zwave_label`, `.zwave_no_info`, `.zwave_help`

### Item table type definitions in legacy.css:

| Table ID | Layout | Use Case |
|----------|--------|----------|
| `#itemtable` | Standard 5-column | Most device cards on tab pages |
| `#itemtablenotype` | Without type column | Temperature, Weather tab pages |
| `#itemtablenostatus` | Without status column | Simple status-only devices |
| `#itemtablesmall` | Compact (min-height 66px) | Dashboard cards |
| `#itemtabledoubleicon` | 2 icon columns | Blinds (open/close on tab pages) |
| `#itemtabletrippleicon` | 3 icon columns | Blinds with stop button |
| `#itemtablesmalldoubleicon` | Compact + 2 icons | Dashboard blinds cards |
| `#itemtablesmalltrippleicon` | Compact + 3 icons | Dashboard blinds with stop |

### If you skip legacy.css:

You'll need to provide your own styling for all table-based card layouts and status classes. This gives maximum creative freedom but requires more work. The default theme's approach of importing it and then overriding is a good middle ground.

---

## 6. Application Layout & Grid System

### Bootstrap 2 Grid

Domoticz uses Bootstrap 2.3.0's float-based grid. **Not** flexbox or CSS grid.

```
.container / .container-fluid
  └── .row / .row-fluid
       ├── .span3  (25% width)
       ├── .span4  (33% width)
       ├── .span6  (50% width)
       └── .span12 (100% width)
```

### Page structure (rendered DOM):

```html
<body class="dashboard 3column">        <!-- body classes change per page -->
  <div class="navbar navbar-inverse navbar-fixed-top">
    <div class="navbar-inner">
      <div class="container">...</div>
    </div>
  </div>
  <div id="main-view" ng-view>          <!-- AngularJS route content -->
    <div class="container">
      <!-- Page-specific content -->
    </div>
  </div>
</div>
```

### Body classes:

The `<body>` element gets classes based on current page:
- `dashboard` — on the dashboard page
- `3column` — 3-column layout (`.span4` cards)
- Additional classes may be set by controllers

### Card grid on dashboard:

Device cards use dynamic span classes:
- **Dashboard 3-column:** `.span4` (33% width, 3 cards per row)
- **Dashboard 4-column:** `.span3` (25% width, 4 cards per row)
- **Tab pages:** `.span4` (always 3 per row)

The default theme's `base.css` overrides `.row-fluid` to use `display: flex` at `min-width: 768px`:
```css
@media all and (min-width: 768px) {
    .row-fluid { display: flex; flex-wrap: wrap; }
}
```

---

## 7. Navigation Bar

### HTML structure (from live DOM):

```html
<div class="navbar navbar-inverse navbar-fixed-top" ng-controller="NavbarController">
  <div class="navbar-inner">
    <div class="container">
      <!-- Brand / Logo -->
      <a class="brand hidden-phone" id="version" href="#Dashboard">
        <img src="images/logo/57.png">
        <h1>Domoticz</h1>
        <h2 id="appversion" class="version-tooltip">2025.2 (build 17399)</h2>
      </a>

      <!-- Main navigation -->
      <ul class="nav" id="appnavbar">
        <li class="clDashboard current_page_item">
          <a id="cDashboard" href="#Dashboard">
            <img src="images/desktop.png">
            <span class="hidden-phone hidden-tablet">Dashboard</span>
          </a>
        </li>
        <!-- Floorplan, Switches, Scenes, Temperature, Weather, Utility -->
        <!-- Each follows same pattern with ng-show for enable/disable -->

        <!-- Custom menu dropdown -->
        <li class="clcustommenu dropdown">...</li>

        <!-- Setup dropdown (Admin only) -->
        <li class="dropdown" has-permission="Admin">
          <a class="dropdown-toggle">
            <img src="images/cogwheel.png">
            <span class="hidden-phone hidden-tablet">Setup</span>
            <b class="caret hidden-phone hidden-tablet"></b>
          </a>
          <ul class="dropdown-menu">...</ul>
        </li>
      </ul>
    </div>
  </div>
</div>
```

### Key navbar selectors:

```css
/* Navbar container */
.navbar.navbar-inverse.navbar-fixed-top { }
.navbar-inner { }

/* Brand area */
.brand { }
.brand h1 { }
.brand h2#appversion { }
.brand img { }

/* Nav items */
#appnavbar { }
#appnavbar > li { }
#appnavbar > li > a { }
#appnavbar > li > a img { }
#appnavbar > li.current_page_item > a { }

/* Dropdown menus */
.dropdown-menu { }
.dropdown-menu li > a { }
.dropdown-submenu > .dropdown-menu { }
```

### Computed styles (default theme):

- `.navbar-inner` background: `rgb(40, 49, 76)` — the accent color
- `.navbar-inner` box-shadow: `rgba(0, 0, 0, 0.5) 0px 2px 24px 0px`
- `.navbar-inner` min-height: `40px`, padding: `5px`
- `.navbar-inner` border-radius: `0px`
- Fixed position, z-index: `1030`

---

## 8. Dashboard Page

**Route:** `#/Dashboard`
**Template:** `views/dashboard_desktop.html` (or `dashboard_mobile.html`)
**Controller:** `DashboardDesktopController`

### Page structure:

```html
<div class="container">
  <!-- Top bar with search, room filter, time/sun info -->
  <div ng-include="'views/inc_topbar.html'">
    <div id="topBar">
      <span id="tbFilters">
        <span id="tbFiltSearch">
          <input class="livesearch jsLiveSearch" type="search">
        </span>
        <span id="tbFiltRooms">
          <select id="comboroom" class="combobox">...</select>
        </span>
      </span>
      <span id="tbTimeSun">
        <span class="tbTime">16:43:10</span>
        <span id="tbSunGroup">...</span>
      </span>
    </div>
  </div>

  <!-- Dashboard override styles (inline) -->
  <style>
    #dashcontent .itemBlock { display: block !important; }
    #dashcontent .liveSearchShown { float: none !important; }
    #dashcontent.devicesListFiltered { margin-left: 0 !important; }
  </style>

  <!-- Main content container -->
  <div id="dashcontent" class="devicesList">

    <!-- Scenes section -->
    <section class="dashCategory" id="dashScenes">
      <h3 class="dashSectionTitle">Scenes / Groups</h3>
      <div class="row-fluid">
        <dz-scene-widget ng-repeat="scene in scenes | filter:filterDevices"
          class="movable span4" id="scene_{{scene.idx}}">
          ...
        </dz-scene-widget>
      </div>
    </section>

    <!-- Lights section -->
    <section class="dashCategory" id="dashLights">
      <h3 class="dashSectionTitle">Switches</h3>
      <div class="row-fluid">
        <dz-light-widget ng-repeat="device in lights | filter:filterDevices"
          class="movable span4" id="light_{{device.idx}}">
          ...
        </dz-light-widget>
      </div>
    </section>

    <!-- Temperature section (NOT a widget — inline template) -->
    <section class="dashCategory" id="dashTemp">
      <h3 class="dashSectionTitle">Temperature</h3>
      <div class="row-fluid">
        <div ng-repeat="device in temperature | filter:filterDevices"
          class="movable span4" id="temp_{{device.idx}}">
          <div class="item itemBlock statusNormal">
            <table id="itemtablesmall">...</table>
          </div>
        </div>
      </div>
    </section>

    <!-- Weather section (NOT a widget — inline template) -->
    <section class="dashCategory" id="dashWeather">
      <!-- Similar to temperature, inline rendered -->
    </section>

    <!-- Utility section -->
    <section class="dashCategory" id="dashUtility">
      <h3 class="dashSectionTitle">Utility</h3>
      <div class="row-fluid">
        <dz-utility-widget ng-repeat="device in utility | filter:filterDevices"
          class="movable span4" id="utility_{{device.idx}}">
          ...
        </dz-utility-widget>
      </div>
    </section>
  </div>
</div>
```

### Dashboard-specific selectors:

```css
#dashcontent { }
.dashCategory { }
.dashSectionTitle { }    /* Section headers: "Switches", "Temperature", etc. */
#dashScenes { }
#dashLights { }
#dashTemp { }
#dashWeather { }
#dashUtility { }

/* Top bar */
#topBar { }
#tbFilters { }
#tbFiltSearch { }
.livesearch { }
#tbFiltRooms { }
#comboroom { }
#tbTimeSun { }
.tbTime { }
#tbSunGroup { }
```

### Important: Temperature & Weather on dashboard

Temperature and weather cards on the dashboard are **NOT** rendered by widget directives. They use inline templates in `dashboard_desktop.html`. This means their HTML structure is slightly different from the tab page versions.

---

## 9. Device Cards — Common Structure

All device cards follow a table-based layout inside a `.item` container. The general pattern:

```html
<!-- Outer wrapper (on tab pages) -->
<div class="span4">                              <!-- Grid column -->
  <div class="item itemBlock statusNormal"       <!-- Card container + status class -->
       id="{{device.idx}}">                      <!-- Device index as ID -->
    <section>                                    <!-- Section wrapper (tab pages) -->
      <table id="itemtable..." border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td id="name" class="item-name">Device Name</td>
          <td id="bigtext"><span>Status Text</span></td>
          <td id="img"><img src="images/..." height="48" width="48"></td>
          <td id="img2"><!-- optional: 2nd icon --></td>
          <td id="img3"><!-- optional: 3rd icon --></td>
          <td id="status"><!-- controls, buttons --></td>
          <td id="lastupdate">Last Seen: ...</td>
          <td class="options"><!-- Log, Edit, Timers buttons --></td>
        </tr>
      </table>
    </section>
  </div>
</div>
```

### Dashboard vs Tab page differences:

| Aspect | Dashboard | Tab Page |
|--------|-----------|----------|
| Wrapper element | `<dz-light-widget>` (display: contents) | `<div class="span4">` |
| Table ID | `itemtablesmall` (compact) | `itemtable` (full) |
| Icon height | 40px | 48px |
| Section element | None | `<section>` wraps the table |
| Options column | Not present | Present (Log/Edit/Timers buttons) |
| Outer ID | `light_37`, `temp_1`, etc. | Just `37`, `1`, etc. |
| Movable class | `.movable` on outer div | `.movable` on outer div |
| Drag classes | `.ui-draggable`, `.ui-draggable-handle`, `.ui-droppable` | Same |

### Common data attributes on `td#name`:

```html
<td id="name" class="item-name"
    data-idx="37"                    <!-- Device index -->
    data-desc=""                     <!-- Device description -->
    data-search="37 Ceiling Light Light/Switch Dummy Off">  <!-- Search text -->
```

---

## 10. Light/Switch Widget

**Directive:** `dzLightWidget` (`www/app/widgets/dzLightWidget.js`, 903 lines)
**Templates:** `views/widgets/light_widget.html` (tab), `light_widget_mobile.html`, dashboard uses separate template inline

### Tab page HTML (rendered):

```html
<div class="item span4 itemBlock statusNormal ui-draggable" id="37">
  <section>
    <table id="itemtable" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td id="name" class="item-name">Ceiling Light</td>
        <td id="bigtext"><span>Off</span></td>
        <td id="img">
          <img src="images/Light48_Off.png" height="48" width="48" class="lcursor">
        </td>
        <!-- Conditional: img2, img3 for blinds -->
        <td id="status">
          <!-- Conditional: selector buttons, dimmer slider -->
        </td>
        <td id="lastupdate">Last Seen: 2026-03-16 16:38:41</td>
        <td class="options">
          <a class="btnsmall" onclick="ShowLog(...)">Log</a>
          <a class="btnsmall" onclick="EditDevice(...)">Edit</a>
          <a class="btnsmall" onclick="ShowTimers(...)">Timers</a>
          <a class="btnsmall" onclick="ShowNotifications(...)">Notifications</a>
        </td>
      </tr>
    </table>
  </section>
</div>
```

### Light device subtypes and their table IDs:

| Subtype | Table ID | Extra Columns |
|---------|----------|---------------|
| Simple on/off | `itemtable` | — |
| Dimmer | `itemtable` | Slider in `#status` |
| Selector switch | `itemtable` | Buttons or dropdown in `#status` |
| Blinds (no stop) | `itemtabledoubleicon` | `#img` (open), `#img2` (close) |
| Blinds (with stop) | `itemtabletrippleicon` | `#img` (open), `#img2` (stop), `#img3` (close) |
| Blinds percentage | `itemtable` | Slider in `#status` |
| Media player | `itemtabledoubleicon` | `#img` (main), `#img2` (remote) |
| Evohome | varies | Evohome-specific icon set |

### Key classes set by `ctrl.getBackgroundClass()`:

```
statusNormal        — Default state
statusTimeout       — Device hasn't reported in time
statusProtected     — Protected device
statusLowBattery    — Low battery warning
statusDisabled      — Device disabled
```

Plus device-type classes from the device itself (e.g., `Fan`, `Blinds`, etc.) and state classes (`onn` for on state).

### Selector buttons HTML:

```html
<!-- SelectorStyle 0: buttons -->
<td id="status">
  <div class="selectorlevels btn-group">
    <button class="btn btn-default" ng-class="{'active': ctrl.isLevelActive(0)}">Off</button>
    <button class="btn btn-default" ng-class="{'active': ctrl.isLevelActive(10)}">Level 1</button>
    <button class="btn btn-default" ng-class="{'active': ctrl.isLevelActive(20)}">Level 2</button>
  </div>
</td>

<!-- SelectorStyle 1: dropdown -->
<td id="status">
  <div class="selectorlevels">
    <select class="ui-selectmenu-button">
      <option value="0">Off</option>
      <option value="10">Level 1</option>
    </select>
  </div>
</td>
```

### Dimmer slider HTML:

```html
<td>
  <div class="dimslider" style="width:150px">
    <!-- jQuery UI slider initialized by controller -->
  </div>
  <br>
  <div class="dimslidertxt">Level: 50%</div>
</td>
```

---

## 11. Temperature Cards

Temperature cards are rendered differently on dashboard vs tab pages.

### Dashboard temperature card:

Rendered inline in `dashboard_desktop.html` (NOT through a widget directive).

```html
<div class="movable span4" id="temp_1">
  <div class="item itemBlock statusNormal">
    <table id="itemtablesmall" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td id="name" class="item-name">Living Room Temperature</td>
        <td id="bigtext"><span>21° C</span></td>
        <td id="img" class="img img1">
          <a href="#/Devices/1/Log">
            <img src="images/temp-20-25.png" height="40" width="40" class="lcursor">
          </a>
        </td>
        <td id="status" class="status">
          <!-- Humidity status, dew point, forecast if applicable -->
        </td>
        <td id="lastupdate" class="lastupdate">
          <span style="font-style: italic">Last Seen</span>: 2026-03-16 16:42:00
        </td>
      </tr>
    </table>
  </div>
</div>
```

### Tab page temperature card:

```html
<div class="span4">
  <div class="item statusNormal">
    <section>
      <table id="itemtablenotype" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td id="name" class="item-name">Living Room Temperature</td>
          <td id="bigtext">
            <img ng-show="ctrl.displayTrend(1)" src="images/arrow_stable.png" height="12">
            <span>21° C</span>
            <!-- Humidity, barometer if applicable -->
          </td>
          <td id="img">
            <img src="images/temp-20-25.png" height="48" width="48">
          </td>
          <td id="status">
            <!-- Humidity status text, dew point, forecast -->
          </td>
          <td id="lastupdate">Last Seen: 2026-03-16 16:42:00</td>
          <td class="options">
            <a class="btnsmall" onclick="ShowLog(...)">Log</a>
            <!-- Timers only for Thermostat/Setpoint devices -->
          </td>
        </tr>
      </table>
    </section>
  </div>
</div>
```

### Temperature icon mapping:

Icons are temperature-range based:
- `temp-0-5.png`, `temp-5-10.png`, `temp-10-15.png`, `temp-15-20.png`, `temp-20-25.png`, `temp-25-30.png`, `temp-gt-30.png`
- Setpoint devices: `setpoint48.png`

---

## 12. Weather Cards

### Tab page weather card:

Weather uses its own controller logic (`WeatherController`) with different display modes based on sensor type.

```html
<div class="span4">
  <div class="item statusNormal" id="unknown">  <!-- ID = forecast state -->
    <section>
      <table id="itemtablenotype" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td id="name" class="item-name">Weather Station</td>
          <td id="bigtext">
            <span>1015 hPa</span>          <!-- Barometer -->
            <!-- OR: rain mm, wind direction/speed, UVI, etc. -->
          </td>
          <td id="img"><img src="images/baro48.png" height="48" width="48"></td>
          <td id="status">
            <span>Prediction: Unknown</span>
            <span>, Altitude: ... meter</span>
          </td>
          <td id="lastupdate">Last Seen: ...</td>
          <td class="options">
            <a class="btnsmall">Log</a>
          </td>
        </tr>
      </table>
    </section>
  </div>
</div>
```

### Weather forecast state IDs:

The `.item` div gets an ID based on forecast state (used for background styling in default theme):
- `#sunny`, `#cloudy`, `#someclouds`, `#rain`, `#thunderstorm`
- `#stable`, `#unstable`, `#unknown`, `#change`

### Weather device subtypes:

| Type | Display | Icon |
|------|---------|------|
| Barometer/THB | Pressure in hPa | `baro48.png` |
| Rain | Rain rate in mm | `rain48.png` |
| Wind | Direction + speed | `wind48.png` |
| UV | UVI value | `uv48.png` |
| Visibility | Distance | `visibility48.png` |
| Solar Radiation | W/m² | `radiation48.png` |

### Default theme weather animations:

The default theme's `extras_and_animations.css` adds atmospheric effects:
```css
/* Thunderstorm background */
#dashcontent #dashWeather #thunderstorm tr {
    background-image: url(/images/baro-thunderstorm.png);
}

/* Cloudy, rainy, sunny, etc. — each with background image and rotation */
```

---

## 13. Utility Widget

**Directive:** `dzUtilityWidget` (`www/app/widgets/dzUtilityWidget.js`, 360 lines)
**Templates:** `views/widgets/utility_widget.html`

### Tab page HTML:

```html
<div class="item span4 itemBlock statusNormal" id="25">
  <section>
    <table id="itemtable" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td id="name" class="item-name">Power Meter</td>
        <td id="bigtext"><span>150 Watt</span></td>
        <td id="img"><img src="images/current48.png" height="48" width="48"></td>
        <td id="status"><span>Today: 3.5 kWh</span></td>
        <td id="lastupdate">Last Seen: ...</td>
        <td class="options">
          <a class="btnsmall">Log</a>
          <!-- Timers for setpoints, Edit for counters -->
        </td>
      </tr>
    </table>
  </section>
</div>
```

### Utility device subtypes:

| Subtype | Bigtext | Status | Icons |
|---------|---------|--------|-------|
| Counter | Counter value | Today total | `counter.png` |
| Energy | Current Watt | Today kWh | `current48.png` |
| Gas | Current m³ | Today total | `gas48.png` |
| Water | Current L | Today total | `water48.png` |
| Setpoint | Target temp | — | `setpoint48.png` |
| Text | Text content | — | `text48.png` |
| Alert | Alert text | — | `Alert48_*.png` |
| Lux | Lux value | — | `lux48.png` |
| Weight | kg value | — | `scale48.png` |
| Air Quality | ppm | — | `air48.png` |
| Percentage | % value | — | `Percentage48.png` |

---

## 14. Scene/Group Widget

**Directive:** `dzSceneWidget` (`www/app/widgets/dzSceneWidget.js`, 168 lines)
**Templates:** `views/widgets/scene_widget.html`

### Tab page HTML:

```html
<div class="item span4 itemBlock statusNormal" id="71">
  <section>
    <table id="itemtablesmall" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td id="name" class="item-name">Morning Routine</td>
        <td id="bigtext"><span>Off</span></td>
        <td id="img">
          <!-- Scene: single activate button -->
          <img src="images/push48.png" height="48" width="48" class="lcursor">
        </td>
        <!-- Group: img1 (on) + img2 (off) -->
        <td id="lastupdate">Last Seen: ...</td>
        <td class="options">
          <a class="btnsmall" onclick="ShowSceneLog(...)">Log</a>
          <a class="btnsmall" onclick="EditScene(...)">Edit</a>
          <a class="btnsmall" onclick="ShowSceneTimers(...)">Timers</a>
        </td>
      </tr>
    </table>
  </section>
</div>
```

### Scene vs Group differences:

| Aspect | Scene | Group |
|--------|-------|-------|
| Icons | Single "push" button | On + Off buttons |
| Status text | "Off" or timestamp | "On" / "Off" / "Mixed" |
| Table ID | `itemtablesmall` | `itemtablesmalldoubleicon` |

---

## 15. Settings & Setup Pages

**Route:** `#/Setup`
**Template:** `views/setup.html`
**Controller:** `SetupController`

### Tab structure:

The setup page uses Bootstrap tabs:

```html
<div id="settingscontent">
  <ul class="sub-tabs nav nav-tabs">
    <li class="active"><a data-toggle="tab" data-target="#tabSystem">System</a></li>
    <li><a data-toggle="tab" data-target="#tabLog">Log</a></li>
    <li><a data-toggle="tab" data-target="#tabNotifications">Notifications</a></li>
    <li><a data-toggle="tab" data-target="#tabEmail">Email</a></li>
    <li><a data-toggle="tab" data-target="#tabMeters">Meters/Counters</a></li>
    <li><a data-toggle="tab" data-target="#tabEnergy">Energy Dashboard</a></li>
    <li><a data-toggle="tab" data-target="#tabFloorplan">Floorplan</a></li>
    <li><a data-toggle="tab" data-target="#tabSecurity">Security</a></li>
    <li><a data-toggle="tab" data-target="#tabOther">Other</a></li>
    <li><a data-toggle="tab" data-target="#tabBackup">Backup/Restore</a></li>
    <li><a class="btn-succes sub-tabs-apply" onclick="SaveSettings()">Apply Settings</a></li>
  </ul>

  <div class="tab-content">
    <div id="tabSystem" class="tab-pane active">
      <!-- Theme selector is here -->
      <select id="combothemes" name="Themes">
        <option>default</option>
        <option>machinon</option>
        <!-- ... -->
      </select>
    </div>
    <!-- Other tab panes -->
  </div>
</div>
```

### Key settings page selectors:

```css
#settingscontent { }
#settingscontent .sub-tabs { }
#settingscontent .sub-tabs li.active a { }
#settingscontent .sub-tabs li:not(.active) a { }
#settingscontent .sub-tabs > li > a.btn-succes { }  /* Apply button */
.sub-tabs-apply { }
#settingscontent .tab-content { }
#settingscontent .tab-pane { }
#settingscontent input.text { }
#settingscontent textarea { }
#settingscontent select { }
#settingscontent .span6 td { }
```

---

## 16. Login Page

**Route:** `#/Login`
**Template:** `views/login.html`
**Controller:** `LoginController`

### Structure:

The login page uses a canvas-animated background with a centered card:

```html
<canvas id="loginBgCanvas"></canvas>  <!-- Animated particle background -->
<div class="login-container">
  <!-- Login card -->
  <div class="login-card" id="loginCard">
    <img src="images/logo/114.png" class="login-logo">
    <h2 class="login-title">Domoticz</h2>

    <!-- Auth method tabs (if passkeys available) -->
    <div class="login-tabs">
      <button class="login-tab active">Password</button>
      <button class="login-tab">Passkey</button>
    </div>

    <!-- Login form -->
    <input id="username" type="text" placeholder="Username">
    <input id="password" type="password" placeholder="Password">
    <label><input id="rememberme" type="checkbox"> Remember Me</label>
    <button class="login-btn" onclick="DoLogin()">Log In</button>
  </div>

  <!-- 2FA card (shown when needed) -->
  <div class="login-card" id="mfaCard" style="display:none">
    <i class="fa fa-shield-halved"></i>
    <h2>Two-Factor Authentication</h2>
    <input id="totp" type="text" maxlength="6" placeholder="Enter 6-digit code">
    <button class="login-btn">Verify</button>
  </div>
</div>
```

### Login-specific selectors:

```css
#loginBgCanvas { }
.login-container { }
.login-card { }
.login-logo { }
.login-title { }
.login-tabs { }
.login-tab { }
.login-tab.active { }
.login-btn { }
#loginCard { }
#mfaCard { }
```

---

## 17. Floorplans

**Route:** `#/Floorplans`
**Template:** `views/floorplans.html`

### Structure:

```html
<div id="floorplancontent">
  <!-- SVG/image-based floor plan -->
  <div id="fphtmlcontent">
    <!-- Device overlays positioned absolutely -->
  </div>
  <!-- Navigation bullets for multiple plans -->
  <div id="BulletGroup">
    <span class="bullet"></span>
    <span class="bulletSelected"></span>
  </div>
</div>
```

### Key selectors:

```css
#floorplancontent { }
#fphtmlcontent { }
#BulletGroup { }
.bullet { }
.bulletSelected { }
```

---

## 18. Modals & Dialogs

Domoticz uses **jQuery UI dialogs** (`.dialog()`), not Bootstrap modals.

### Dialog HTML pattern:

```html
<!-- Hidden div in index.html, shown by .dialog("open") -->
<div id="dialog-replacedevice" title="Replace Device">
  <p>Select the device to replace:</p>
  <select id="comboreplacedevice"></select>
</div>
```

### Dialog selectors (jQuery UI):

```css
/* Dialog container */
.ui-dialog { }
.ui-dialog-titlebar { }
.ui-dialog-title { }
.ui-dialog-titlebar-close { }
.ui-dialog-content { }
.ui-dialog-buttonpane { }
.ui-dialog-buttonset { }

/* jQuery UI base classes */
.ui-widget { }
.ui-widget-content { }
.ui-widget-header { }
.ui-state-default { }
.ui-state-hover { }
.ui-state-active { }

/* Overlay behind modal dialogs */
.ui-widget-overlay { }

/* Bootbox (Bootstrap-style dialogs used for confirmations) */
.modal { }
.modal-header { }
.modal-body { }
.modal-footer { }
.modal-title { }
.bootbox-body { }
```

### Known dialog IDs:

- `#dialog-replacedevice` — Device replacement
- `#dialog-camera-live` — Camera live view
- `#dialog-media-remote` — Media player remote (SVG)
- `#dialog-lmsplayer-remote` — Logitech Media Server remote (SVG)
- `#dialog-heosplayer-remote` — HEOS player remote (SVG)
- `#dialog-addlightdevice` — Add light device (in LightsController)
- `#dialog-addmanuallightdevice` — Add manual light device
- `#dialog-findlatlong` — Find latitude/longitude

---

## 19. Charts (Highcharts)

Domoticz uses Highcharts for all device log charts. Theme `custom.js` can configure chart appearance.

### Full Highcharts theming template:

```javascript
if (typeof Highcharts !== 'undefined') {
    Highcharts.setOptions({
        chart: {
            backgroundColor: 'transparent',      // Chart area background
            plotBackgroundColor: 'transparent',    // Plot area background
            style: { fontFamily: 'inherit' }      // Inherit page font
        },
        title: {
            style: { color: '#c0cfe0' }           // Chart title color
        },
        subtitle: {
            style: { color: '#7a9ab5' }           // Subtitle color
        },
        legend: {
            itemStyle: { color: '#9ab' },          // Legend text
            itemHoverStyle: { color: '#e0e0e0' }   // Legend hover text
        },
        tooltip: {
            backgroundColor: 'rgba(0,20,45,0.92)', // Tooltip background
            borderColor: '#43A4D3',                 // Tooltip border
            style: { color: '#e0e0e0' }             // Tooltip text
        },
        xAxis: {
            lineColor: '#2a3f55',                   // X-axis line
            tickColor: '#2a3f55',                   // X-axis ticks
            labels: { style: { color: '#7a9ab5' } } // X-axis labels
        },
        yAxis: {
            gridLineColor: '#1e3248',               // Y-axis grid lines
            labels: { style: { color: '#7a9ab5' } } // Y-axis labels
        },
        plotOptions: {
            series: {
                // Default series colors can be set here
            }
        },
        // Series colors array
        colors: ['#43A4D3', '#7cb5ec', '#90ed7d', '#f7a35c',
                 '#8085e9', '#f15c80', '#e4d354', '#2b908f']
    });
}
```

### Chart container selectors:

```css
/* Chart wrapper panels (styled by default theme) */
.device-log-chart { }
.wind-direction-chart { }
.wind-speed-frequency-chart { }

/* Highcharts elements */
.highcharts-container { }
.highcharts-tooltip { }
.highcharts-legend { }

/* Highcharts context menu */
#highcharts-menu { }
#highcharts-menu-item { }
```

---

## 20. Notifications (Noty)

Domoticz uses the Noty library for toast notifications.

### Selectors:

```css
/* Noty containers */
.noty_bar { }
.noty_body { }
.noty_close_button { }

/* Noty types */
.noty_type__success { }
.noty_type__error { }
.noty_type__warning { }
.noty_type__info { }

/* Noty theme (relax) */
.noty_theme__relax { }
```

---

## 21. Data Tables

Several pages use DataTables (jQuery plugin) for tabular data: Devices, Hardware, Users, Log, etc.

### Selectors:

```css
/* DataTables wrapper */
.dataTables_wrapper { }
.dataTables_length { }
.dataTables_filter { }
.dataTables_info { }
.dataTables_paginate { }

/* Table styling */
table.dataTable { }
table.dataTable thead th { }
table.dataTable tbody td { }
table.dataTable tbody tr.odd { }
table.dataTable tbody tr.even { }
table.dataTable tbody tr:hover { }

/* DataTables with jQuery UI */
.dataTables_wrapper .ui-widget-header { }
```

---

## 22. Form Controls

### Input fields:

```css
/* Standard inputs (styled by jQuery UI) */
input.ui-widget-content { }
textarea.ui-widget-content { }
select { }

/* Focus states */
input:focus { }
textarea:focus { }

/* Settings page inputs */
#settingscontent input.text { }
#settingscontent select { }
#settingscontent textarea { }

/* Checkboxes (default theme uses custom toggle switches) */
input[type='checkbox']:not(.noscheck) { }
input[type='checkbox']:not(.noscheck) + label { }
input[type='checkbox']:not(.noscheck) + label:before { }
input[type='checkbox']:not(.noscheck) + label:after { }
input[type='checkbox']:not(.noscheck):checked + label:before { }
input[type='checkbox']:not(.noscheck):checked + label:after { }
```

### Buttons:

```css
/* Bootstrap buttons */
.btn { }
.btn.btn-default { }
.btn.btn-default:hover { }
.btn.btn-default:disabled { }
.btn.btn-default.active { }
.btn-group > .btn { }
.btn-info { }

/* Device card action buttons */
.btnsmall { }
a.btnsmall { }

/* Apply/save buttons in settings */
.btn-succes { }         /* Note: typo in upstream, not "success" */
.sub-tabs-apply { }

/* jQuery UI buttons */
.ui-button { }
.ui-button-text { }
.ui-btn { }
.ui-btn:hover { }
```

---

## 23. Status Classes

These classes are applied to `.item` containers and affect the `td#name` cell background:

```css
/* Normal operation */
.item.statusNormal td#name { }      /* Light blue background in legacy */

/* Warning states */
.item.statusTimeout td#name { }     /* Red — device hasn't reported */
.item.statusLowBattery td#name { }  /* Yellow — low battery */

/* Special states */
.item.statusProtected td#name { }   /* Blue — protected device */
.item.statusDisabled td#name { }    /* Gray, opacity 0.5 — disabled */

/* Evohome thermostat states (many variants) */
.item.statusEvoSetPointFollowSchedule td#name { }
.item.statusEvoSetPointOverride td#name { }
.item.statusEvoSetPointPermanent td#name { }
.item.statusEvoSetPointFrostProtection td#name { }
.item.statusEvoSetPointCustom td#name { }
/* ... plus Hot Water variants */
```

### Temperature-specific status:

Temperature cards use `$root.GetTempBackgroundStatus(device)` which returns status classes based on temperature ranges.

---

## 24. Drag & Drop

Dashboard device cards support drag-and-drop reordering.

### Classes applied:

```css
/* Draggable elements */
.movable { }                          /* Has drag capability */
.ui-draggable { }                     /* jQuery UI draggable */
.ui-draggable-handle { }              /* Drag handle */
.ui-droppable { }                     /* Can receive drops */

/* During drag */
.ui-draggable-dragging { }            /* Applied while dragging */
.ui-draggable-dragging tr { }         /* The default theme scales this */
```

### Default theme drag effect:

```css
.ui-draggable-dragging tr {
    transform: scale(1.05);
}
```

### Important notes:

- Drag uses `helper: 'clone'` — a clone follows the cursor
- Same-type validation: lights can only swap with lights, not scenes
- The original element stays in place during drag
- Angular classes: NOT `.ui-sortable-helper` (that's jQuery UI Sortable, not used here)

---

## 25. Mobile & Responsive

### Mobile detection:

Domoticz detects mobile via user agent string:
```javascript
if (/Android|webOS|iPhone|iPad|iPod|ZuneWP7|BlackBerry/i.test(navigator.userAgent)) {
    $.myglobals.ismobile = true;
}
```

### Responsive classes (Bootstrap 2):

```css
.hidden-phone { }     /* Hidden on phones (<768px) */
.hidden-tablet { }    /* Hidden on tablets (768-979px) */
.hidden-desktop { }   /* Hidden on desktop (>980px) */
.visible-phone { }
.visible-tablet { }
.visible-desktop { }
```

### Mobile templates:

Mobile devices get separate widget templates:
- `light_widget_mobile.html`
- `scene_widget_mobile.html`
- `utility_widget_mobile.html`
- `dashboard_mobile.html`

### Key responsive breakpoints used:

| Breakpoint | Use |
|-----------|-----|
| `< 768px` | Phone layout, navbar text hidden |
| `768px - 979px` | Tablet, some text hidden |
| `768px - 1200px` | Navbar link padding reduced |
| `> 980px` | Full desktop layout |
| `> 1200px` | Full desktop with all elements |

### Navbar responsive behavior:

- Phone: Only icons shown (text spans have `hidden-phone`)
- Tablet: Only icons shown (text spans have `hidden-tablet`)
- Desktop: Icons + text labels

---

## 26. CSS Custom Properties

The upstream codebase uses CSS custom properties minimally. The default theme defines:

```css
:root {
    --accent-color: #283750;
}
```

This is used in 8 places in `css/style.css`:
- Navigation bar borders
- Button borders and backgrounds
- Active tab indicators

### Font Awesome custom properties (automatically set):

```css
:root {
    --fa-style-family-classic: "Font Awesome 6 Free";
    --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
}
```

### Strategy for theme authors:

Since upstream barely uses CSS custom properties, themes can define their own property system for internal consistency. The `--accent-color` property is the main one worth overriding:

```css
:root {
    --accent-color: #your-accent-color;

    /* Add your own custom properties */
    --bg-primary: #1a1a2e;
    --bg-card: rgba(255,255,255,0.05);
    --text-primary: #eee;
    --text-secondary: #999;
    --border-color: rgba(255,255,255,0.1);
}
```

---

## 27. Theme JavaScript (custom.js)

Your `custom.js` runs after all other scripts. Available APIs:

### Global variables:

```javascript
$.myglobals.ismobile      // Boolean: is mobile device
$.myglobals.ismobileint   // Boolean: is mobile (internal)
window.myglobals.DashboardType  // 0=desktop, 2=mobile
```

### Available libraries:

```javascript
jQuery ($)               // DOM manipulation
Highcharts              // Chart library
moment                  // Date/time library
$.i18n                  // Internationalization
```

### Common custom.js patterns:

```javascript
// 1. Highcharts theming (most common use)
if (typeof Highcharts !== 'undefined') {
    Highcharts.setOptions({ /* ... */ });
}

// 2. Check if mobile
if ($.myglobals && $.myglobals.ismobile) {
    // Mobile-specific behavior
}

// 3. Add dynamic CSS class based on time of day
var hour = new Date().getHours();
if (hour >= 18 || hour < 6) {
    document.body.classList.add('nighttime');
}
```

### What NOT to do in custom.js:

- **Do not modify Angular-owned DOM structure** — Angular will overwrite it on re-render
- **Do not add/remove `<td>` elements** in widget tables — they'll disappear on digest
- **Do not use `setInterval` heavily** — it interferes with Angular's digest cycle
- Prefer CSS-only solutions whenever possible

---

## 28. Complete Route Map

### Public pages (no auth required):

| Route | Page | Description |
|-------|------|-------------|
| `#/Dashboard` | Dashboard | Favorites overview |
| `#/LightSwitches` | Switches | All light/switch devices |
| `#/Lights` | Switches | Alias for LightSwitches |
| `#/Temperature` | Temperature | Temperature/humidity sensors |
| `#/Weather` | Weather | Weather devices |
| `#/Utility` | Utility | Counters, energy, setpoints |
| `#/Scenes` | Scenes | Scenes and groups |
| `#/Floorplans` | Floorplans | Floor plan viewer |
| `#/Forecast` | Forecast | Weather forecast |
| `#/Frontpage` | Frontpage | Custom front page |
| `#/Login` | Login | Authentication |
| `#/Logout` | Logout | Sign out |
| `#/Offline` | Offline | Offline indicator |
| `#/MyProfile` | My Profile | User profile |
| `#/About` | About | Version info |
| `#/Energy` | Energy Dashboard | Energy consumption |
| `#/Custom/:page` | Custom Pages | User-defined pages |

### Device sub-pages:

| Route | Page |
|-------|------|
| `#/Devices/:id/Log` | Device log/history charts |
| `#/Devices/:id/Timers` | Device timers |
| `#/Devices/:id/Notifications` | Device notifications |
| `#/Devices/:id/LightEdit` | Light device editor |
| `#/Devices/:id/Report/:year?/:month?` | Device reports |
| `#/Scenes/:id/Log` | Scene log |
| `#/Scenes/:id/Timers` | Scene timers |

### Admin-only pages:

| Route | Page |
|-------|------|
| `#/Setup` | System settings (10 tabs) |
| `#/Hardware` | Hardware list |
| `#/Hardware/:id` | Hardware setup |
| `#/Devices` | Device management |
| `#/Users` | User management |
| `#/Log` | System log |
| `#/Events` | Event/automation editor |
| `#/Roomplan` | Room plans |
| `#/Floorplanedit` | Floor plan editor |
| `#/Timerplan` | Timer plans |
| `#/CustomIcons` | Custom icons |
| `#/UserVariables` | User variables |
| `#/Applications` | Applications |
| `#/Mobile` | Mobile devices |
| `#/Cam` | Cameras |
| `#/Notification` | Send notification |
| `#/DPInflux` | InfluxDB push |
| `#/DPMQTT` | MQTT push |
| `#/DPFibaro` | Fibaro push |
| `#/DPHttp` | HTTP push |
| `#/DPGooglePubSub` | Google PubSub push |
| `#/Update` | System update |
| `#/RestoreDatabase` | Database restore |
| `#/ZWaveTopology` | Z-Wave topology |
| `#/SetupWizard` | Initial setup wizard |

---

## 29. Selector Reference

### High-priority selectors to override

These are the selectors that have the biggest visual impact:

```css
/* === Page Background === */
body { }

/* === Navbar === */
.navbar-inner { }
.navbar .brand { }
.navbar .brand h1 { }
#appnavbar > li > a { }
#appnavbar > li.current_page_item > a { }
.dropdown-menu { }
.dropdown-menu > li > a { }

/* === Device Cards === */
.row-fluid [class^="span"] { }          /* Card column background */
.item { }                                /* Card container */
.item.itemBlock { }
.item td#name { }                        /* Device name cell */
.item td#bigtext { }                     /* Status text cell */
.item td#bigtext span { }
.item td#img { }                         /* Icon cell */
.item td#img img { }
.item td#status { }                      /* Controls/status cell */
.item td#lastupdate { }                  /* Timestamp cell */
td.options { }                           /* Action buttons cell */
td.options a.btnsmall { }               /* Log/Edit/Timers buttons */

/* === Dashboard Sections === */
#dashcontent { }
.dashCategory { }
.dashSectionTitle { }

/* === Settings === */
#settingscontent { }
.sub-tabs { }
.sub-tabs li.active a { }
.sub-tabs-apply { }

/* === Dialogs === */
.ui-dialog { }
.ui-dialog-titlebar { }
.ui-dialog-content { }
.ui-widget-content { }

/* === Forms === */
input.ui-widget-content { }
textarea.ui-widget-content { }
select { }
input:focus { }

/* === Tables === */
.dataTables_wrapper { }
table.dataTable { }

/* === Buttons === */
.btn { }
.btn.btn-default { }
.selectorlevels .btn { }

/* === Status Colors === */
.item.statusNormal td#name { }
.item.statusTimeout td#name { }
.item.statusLowBattery td#name { }
.item.statusProtected td#name { }
.item.statusDisabled td#name { }

/* === Login === */
.login-card { }
.login-btn { }

/* === Topbar === */
#topBar { }
.livesearch { }
#comboroom { }
.tbTime { }

/* === Sliders === */
.ui-slider { }
.ui-slider-handle { }
.ui-slider-range { }
.dimslider { }
.dimslidertxt { }

/* === Checkboxes (custom toggle) === */
input[type='checkbox']:not(.noscheck) + label { }
input[type='checkbox']:not(.noscheck):checked + label:before { }
```

---

## 30. Golden Rules for Theme Authors

### 1. Never modify Angular-owned DOM structure

Angular owns the widget templates and re-renders them during digest cycles, `$watch` callbacks, and `$timeout`. Any DOM changes you make with jQuery (adding TDs, moving elements, wrapping things) **will be lost** on the next render cycle.

**Do:** Use CSS to reposition, resize, show/hide elements.
**Don't:** Use JavaScript to add/remove/move DOM elements inside widgets.

### 2. Import legacy.css (unless you're doing a complete rewrite)

```css
@import url("../../css/legacy.css");
```

This gives you the mobile table layouts, status colors, and widget directive `display: contents` fix for free. Skip it only if you're providing all of this yourself.

### 3. Override `--accent-color`

This single CSS custom property affects the navbar and several UI elements:

```css
:root { --accent-color: #your-color; }
```

### 4. Respect the table-based card layout

Device cards are `<table>` elements, not divs. You can restyle them significantly with CSS (including `display: grid` or `display: flex` on the `<tr>`) but the HTML structure is fixed. Work with it, not against it.

### 5. Test all device card variants

There are many table ID variants. At minimum, test:
- `#itemtable` — standard card
- `#itemtablesmall` — dashboard compact card
- `#itemtablenotype` — temperature/weather cards
- `#itemtabledoubleicon` — blinds cards
- `#itemtabletrippleicon` — blinds with stop

### 6. Test all status states

Ensure your color scheme works for:
- `statusNormal` — most common
- `statusTimeout` — must be visually alarming
- `statusLowBattery` — must be noticeable
- `statusProtected` — should be distinct
- `statusDisabled` — should look "dimmed"

### 7. Theme Highcharts in custom.js

Charts use their own rendering system. CSS doesn't affect chart internals. Use `Highcharts.setOptions()` in your `custom.js`.

### 8. Test responsive behavior

The navbar drops to icon-only on mobile. Device cards stack vertically. Verify:
- Navbar is usable on small screens
- Cards are readable when stacked
- Dialogs don't overflow the viewport
- Touch targets are large enough (sliders, buttons)

### 9. Remember the page reload requirement

Theme changes require a full page reload. Don't design anything that assumes hot-reload.

### 10. Use the cascade, not `!important`

Your theme loads last. At equal specificity, you win. Prefer matching upstream specificity over sprinkling `!important` everywhere. The one exception: the inline dashboard styles use `!important`, which you may need to counter.

---

## Appendix: Default Theme Computed Styles (Reference)

Captured from a live Domoticz instance with the default theme active:

| Element | Background | Color | Font |
|---------|-----------|-------|------|
| `body` | `linear-gradient(#001c38, #0f0c2b)` fixed | `#ddd` | Arial, 13.3px |
| `.navbar-inner` | `rgb(40, 49, 76)` | `#ddd` | — |
| `.navbar .brand` | transparent | `#999` | 20px, weight 200 |
| `.row-fluid [class^="span"]` | `#11213d` | — | — |
| `.item td#name` | (from legacy.css/status) | — | 130% |
| `select` | `#283750` | white | — |
| `input.ui-widget-content` | dark | light | — |
| `.ui-dialog` | dark gradient | — | — |
| `.modal` | dark gradient | — | — |
