// wx-dom.js — shim additions for the WASM DOM port (non-universal build).
//
// Loaded as a second --pre-js AFTER wx.js, only in DOM-port bundles.
// wx.js keeps owning window management, the element registry, clipboard,
// file dialogs and the Canvas2D drawing used by owner-drawn widgets
// (canvas islands). This file owns native-control DOM elements: creation
// (type-based factory, composites where a wx control maps to more than one
// element), property sync, clone-based intrinsic measurement, and event
// wiring back into WASM via wx_dom_event (src/wasm/domevents.cpp).
//
// All functions are no-ops/guarded in Web Workers (-pthread evaluates
// pre-js there too) — see the wx.js worker guard precedent.

(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  var nextControlId = 1;
  var controls = new Map(); // domId -> root HTMLElement
  var inputs = new Map();   // domId -> value-bearing element (if != root)
  var labels = new Map();   // domId -> label text target (if != root)

  // Dark-theme overrides for the DOM widgets (pcbjam comments-ux 0002): the
  // factory below sets "classic light" INLINE styles; these html.dark-scoped
  // !important rules override them live when the embedding page toggles its
  // theme class — no per-element re-styling, and light mode is untouched.
  // Keep the palette aligned with the wx wasm system-colour table
  // (src/wasm/settings.cpp): face #2d2d3e, window #1e1e2c, text #e4e4ee.
  (function injectDarkThemeStyles() {
    var css =
      'html.dark [data-wx-menu-bar="1"],' +
      'html.dark [data-wx-tool-bar="1"]{background:#2d2d3e !important;}' +
      'html.dark [data-wx-menu-bar="1"] .wx-menu-title{color:#e4e4ee !important;}' +
      'html.dark .wx-menu-popup{background:#2d2d3e !important;' +
        'border-color:#121220 !important;color:#e4e4ee !important;}' +
      'html.dark [data-wx-check-list="1"]{background:#1e1e2c !important;' +
        'border-color:#121220 !important;color:#e4e4ee !important;}' +
      'html.dark .wx-tab-strip{background:#2d2d3e !important;' +
        'border-bottom-color:#121220 !important;}' +
      'html.dark .wx-tab-strip button{background:#23233a !important;' +
        'color:#e4e4ee !important;border-color:#121220 !important;}' +
      'html.dark .wx-tab-strip button[aria-selected="true"]' +
        '{background:#3a3a54 !important;}' +
      'html.dark #wx-tooltip{background:#2d2d3e !important;' +
        'color:#e4e4ee !important;border-color:#5a5a72 !important;}' +
      'html.dark .wx-tool{color:#e4e4ee !important;}' +
      'html.dark .wx-tool[data-wx-toggled="1"]{background:#3d6ae0 !important;}' +
      'html.dark [data-wx-scrollbar="1"]{background:#23233a !important;}' +
      'html.dark [data-wx-scrollbar="1"] .wx-sb-thumb{background:#4a4a62 !important;' +
        'border-color:#5a5a72 !important;}' +
      // Native form controls (select/input/textarea .wx-dom-control): the page's
      // dark foreground bleeds into them while their native background stays
      // white — restyle both, and flip color-scheme so the dropdown list and
      // caret follow.
      'html.dark select.wx-dom-control,' +
      'html.dark input.wx-dom-control,' +
      'html.dark textarea.wx-dom-control{background:#1e1e2c !important;' +
        'color:#e4e4ee !important;border-color:#121220 !important;' +
        'color-scheme:dark;}' +
      // checkbox/radio inputs are CHILDREN of a label.wx-dom-control, so the
      // rule above never reaches them; flip their color-scheme too.
      'html.dark label.wx-dom-control{color-scheme:dark;}';
    var style = document.createElement('style');
    style.id = 'wx-dom-dark-theme';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  // Flag read by the C++ keyboard callback (src/wasm/app.cpp): while a DOM
  // editable owns browser focus, wx must not swallow/preventDefault keys.
  window.wxDomEditableFocused = 0;

  // Mirror of wxDomEventKind in include/wx/wasm/window.h.
  var EVT = { CLICK: 1, INPUT: 2, CHANGE: 3, FOCUSIN: 4, FOCUSOUT: 5,
              ENTER: 6, SPIN_UP: 7, SPIN_DOWN: 8, MENU: 9, TOOL: 10,
              TAB: 11, SCROLL: 12,
              KEY_UP: 13, KEY_DOWN: 14, KEY_PAGEUP: 15, KEY_PAGEDOWN: 16 };
  // Navigation keys an <input> does not need for editing, forwarded to wx as
  // wxEVT_CHAR_HOOK (findings O-2: filter-box Enter/arrows were dead).
  var NAV_KEY_EVT = { ArrowUp: EVT.KEY_UP, ArrowDown: EVT.KEY_DOWN,
                      PageUp: EVT.KEY_PAGEUP, PageDown: EVT.KEY_PAGEDOWN };

  // Last pointer position in viewport (clientX/Y) coordinates — read by
  // wxShowContextMenu when DoPopupMenu is invoked "at the mouse" (the KiCad
  // canvas right-click case passes wxDefaultCoord). Tracked on every pointer
  // event below, including over the GAL canvas (where forwardTarget is null).
  var lastPointerClientX = 0;
  var lastPointerClientY = 0;

  // Marks the bundle as DOM-port for tests/boot code.
  window.wxDomPort = true;
  window.wxDomControls = controls;

  function dispatch(domId, kind) {
    // Containment for a chain that died mid-flight (trap, or a throwing wx
    // event handler): its dispatch-interlock guard never unwound — release it
    // or every later event defers forever behind a chain that is gone.
    // Guarded: defends against serving a stale output/ mix where this glue
    // and the wasm disagree about the export set.
    var contain = function (e) {
      // Surfaces in test logs; must never throw back into DOM event handlers.
      console.error('wx_dom_event(' + domId + ',' + kind + ') failed:', e);
      try {
        Module['ccall']('wx_dispatch_abandon', null, [], []);
      } catch (e2) {
        /* nothing else to do - the runtime is already in trouble */
      }
    };
    try {
      var p = Module['ccall']('wx_dom_event', null, ['number', 'number'], [domId, kind]);
      // JSPI: wx_dom_event is a PROMISING export — a throwing handler
      // surfaces as an async REJECTION of the returned promise, which the
      // sync catch below can never see.
      if (p && typeof p.then === 'function') p.then(null, contain);
    } catch (e) {
      contain(e);
    }
  }

  function isEditable(el) {
    return el && (el.tagName === 'TEXTAREA' ||
                  (el.tagName === 'INPUT' &&
                   ['text', 'password', 'number', 'search'].indexOf(el.type) >= 0));
  }

  function flexCenter(el) {
    el.dataset.wxDisplay = 'flex';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
  }

  // Builds the element structure for a logical wx control type. Plain HTML
  // tags ("span", "button", "textarea", "input"+typeAttr) pass through for
  // the simple controls; composite types build wrappers.
  // Returns { root, input, label } (input/label optional).
  function buildControl(type, typeAttr) {
    var root, input, label;
    switch (type) {
      case 'checkbox':
      case 'radio': {
        root = document.createElement('label');
        // Breathing room around the row: measured into the intrinsic size, so
        // sizers pick it up (wxDomCreateControl only force-zeroes padding on
        // controls that didn't set their own).
        root.style.padding = '3px 0';
        input = document.createElement('input');
        input.type = type;
        input.style.margin = '0 5px 0 0';
        // Never let a too-narrow rect crush the box into the label.
        input.style.flexShrink = '0';
        label = document.createElement('span');
        label.className = 'wx-label';
        root.appendChild(input);
        root.appendChild(label);
        flexCenter(root);
        break;
      }
      case 'toggle': {
        root = document.createElement('button');
        root.setAttribute('aria-pressed', 'false');
        flexCenter(root);
        root.style.justifyContent = 'center';
        root.style.padding = '1px 9px';
        break;
      }
      case 'statbox': {
        // Visual chrome only: the wx children of a wxStaticBox are SIBLING
        // DOM controls, so the fieldset must never intercept their input.
        root = document.createElement('fieldset');
        root.style.border = '1px solid #b5b2aa';
        root.style.borderRadius = '2px';
        label = document.createElement('legend');
        label.className = 'wx-label';
        label.style.padding = '0 3px';
        root.appendChild(label);
        root.dataset.wxChrome = '1';
        break;
      }
      case 'statline': {
        root = document.createElement('div');
        root.style.background = '#909090';
        root.dataset.wxChrome = '1';
        break;
      }
      case 'gauge': {
        root = document.createElement('progress');
        root.max = 100;
        root.value = 0;
        break;
      }
      case 'slider': {
        root = document.createElement('input');
        root.type = 'range';
        break;
      }
      case 'scrollbar': {
        // Custom track+thumb (a native <input type=range> can't express a
        // proportional thumb). Drag handlers are wired in wxDomCreateControl
        // once the domId is known; metrics arrive via wxDomSetScrollbar.
        // typeAttr "v" = vertical, "h" = horizontal.
        root = document.createElement('div');
        root.dataset.wxScrollbar = '1';
        var sbVertical = (typeAttr === 'v');
        root.style.background = '#e8e8e8';
        root.style.userSelect = 'none';
        var sbTrack = document.createElement('div');
        sbTrack.className = 'wx-sb-track';
        sbTrack.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;';
        var sbThumb = document.createElement('div');
        sbThumb.className = 'wx-sb-thumb';
        sbThumb.style.cssText =
          'position:absolute;background:#a0a0a0;border:1px solid #808080;' +
          'border-radius:2px;box-sizing:border-box;touch-action:none;' +
          'display:none;' +
          (sbVertical ? 'left:0;right:0;top:0;height:0;'
                      : 'top:0;bottom:0;left:0;width:0;');
        sbTrack.appendChild(sbThumb);
        root.appendChild(sbTrack);
        root._wxSb = { pos: 0, thumb: 0, range: 0, page: 0,
                       vertical: sbVertical, dragging: false, phase: 1,
                       dragStart: 0, dragStartOffset: 0 };
        break;
      }
      case 'choice': {
        root = document.createElement('select');
        break;
      }
      case 'listbox': {
        root = document.createElement('select');
        root.multiple = true;
        break;
      }
      case 'spinbutton': {
        // vertical up/down button pair; clicks dispatch SPIN_UP/SPIN_DOWN
        root = document.createElement('div');
        root.dataset.wxSpin = '1';
        var mk = function (txt, cls) {
          var b = document.createElement('button');
          b.textContent = txt;
          b.className = cls;
          b.style.cssText = 'flex:1;padding:0;margin:0;font-size:7px;' +
                            'line-height:1;min-height:0;overflow:hidden;';
          root.appendChild(b);
          return b;
        };
        root.style.display = 'flex';
        root.dataset.wxDisplay = 'flex';
        root.style.flexDirection = 'column';
        mk('▲', 'wx-spin-up');
        mk('▼', 'wx-spin-down');
        break;
      }
      case 'radiobox': {
        // owns its item rows (unlike statbox chrome): fieldset + legend +
        // one <label><input type=radio><span></span></label> per item,
        // filled by wxDomSetItems.
        root = document.createElement('fieldset');
        root.style.border = '1px solid #b5b2aa';
        root.style.borderRadius = '2px';
        label = document.createElement('legend');
        label.className = 'wx-label';
        label.style.padding = '0 3px';
        root.appendChild(label);
        root.dataset.wxRadioBox = '1';
        break;
      }
      case 'image': {
        root = document.createElement('img');
        root.dataset.wxChrome = '1'; // non-interactive like statbmp
        // Layout may hand the <img> a rect bigger than the bitmap (sizer
        // stretch, min-size constraints); keep the aspect instead of the
        // default object-fit:fill smear.
        root.style.objectFit = 'contain';
        break;
      }
      case 'combobox': {
        // Editable combo: text input + datalist autocomplete (HTML has no
        // native editable select). wxDomSetItems fills the datalist.
        root = document.createElement('input');
        root.type = 'text';
        var dl = document.createElement('datalist');
        dl.id = 'wx-datalist-' + nextControlId; // == the domId assigned below
        root.setAttribute('list', dl.id);
        document.body.appendChild(dl);
        root.dataset.wxDatalist = dl.id;
        break;
      }
      case 'checklistbox': {
        // Scrollable list of checkbox rows; row checkbox toggles dispatch
        // CHANGE with the row index retrievable via wxDomGetIntValue.
        root = document.createElement('div');
        root.dataset.wxCheckList = '1';
        root.style.overflowY = 'auto';
        root.style.background = '#ffffff';
        root.style.border = '1px solid #b5b2aa';
        break;
      }
      case 'menubar': {
        // Horizontal strip of menu-title buttons; menus open as popup divs
        // (built by wxDomMenuSetStructure).
        root = document.createElement('div');
        root.dataset.wxMenuBar = '1';
        root.style.background = '#d4d0c8';
        flexCenter(root);
        break;
      }
      case 'toolbar': {
        // Horizontal strip of tool buttons (built by wxDomToolbarSetTools).
        root = document.createElement('div');
        root.dataset.wxToolBar = '1';
        root.style.background = '#d4d0c8';
        flexCenter(root);
        break;
      }
      case 'notebook': {
        // The root box covers the whole page area, so it is CHROME — it
        // must never swallow mouse events meant for page content (canvas
        // islands and sibling DOM controls). Only the tab strip inside is
        // interactive (built by wxDomNotebookSetTabs).
        root = document.createElement('div');
        root.dataset.wxNotebook = '1';
        root.dataset.wxChrome = '1';
        var strip = document.createElement('div');
        strip.className = 'wx-tab-strip';
        strip.setAttribute('role', 'tablist');
        strip.style.cssText =
          'position:absolute;left:0;top:0;right:0;display:flex;' +
          'align-items:flex-end;background:#d4d0c8;' +
          'border-bottom:1px solid #808080;pointer-events:auto;' +
          'overflow:hidden;';
        root.appendChild(strip);
        break;
      }
      default: {
        root = document.createElement(type);
        if (typeAttr) root.setAttribute('type', typeAttr);
        if (type === 'span' || type === 'button' || type === 'label') {
          flexCenter(root);
        }
        if (type === 'button') {
          root.style.padding = '1px 9px';
          root.style.justifyContent = 'center';
        }
        break;
      }
    }
    // Passive controls have no interactive DOM behavior of their own —
    // left clicks on them belong to wx (KiCad binds LEFT_DOWN on labels).
    if (root && (type === 'span' || type === 'gauge')) {
      root.dataset.wxPassive = '1';
    }
    return { root: root, input: input, label: label };
  }

  window.wxDomCreateControl = function (tlwCssId, type, typeAttr) {
    var container = window.__wxGetWindowElement(tlwCssId);
    if (!container) {
      console.error('wxDomCreateControl: no window element for css id ' + tlwCssId);
      return 0;
    }

    var built = buildControl(type, typeAttr);
    var el = built.root;

    var domId = nextControlId++;
    el.dataset.wxDomId = String(domId);
    el.classList.add('wx-dom-control');
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.boxSizing = 'border-box';
    el.style.margin = '0';
    if (!el.style.padding) el.style.padding = '0';
    el.style.overflow = type === 'statbox' ? 'visible' : 'hidden';
    if (el.dataset.wxDisplay === undefined) el.dataset.wxDisplay = '';
    // wx labels never soft-wrap (the wx sizer sizes them exactly), but
    // multiline wxStaticText labels DO contain hard \n breaks — 'pre'
    // preserves those while preventing wrapping. <textarea> keeps native
    // wrapping.
    if (type !== 'textarea') {
      el.style.whiteSpace = 'pre';
    }
    // The TLW container has pointer-events:none so input funnels to the
    // canvas; real controls take their own events — except pure chrome
    // (statbox/statline), which must not block canvas hit-testing or
    // sibling controls.
    el.style.pointerEvents = el.dataset.wxChrome ? 'none' : 'auto';

    var valueEl = built.input || el;
    if (built.input) inputs.set(domId, built.input);
    if (built.label) labels.set(domId, built.label);

    if (el.dataset.wxSpin) {
      el.querySelector('.wx-spin-up').addEventListener('click', function (ev) {
        dispatch(domId, EVT.SPIN_UP);
        ev.stopPropagation();
      });
      el.querySelector('.wx-spin-down').addEventListener('click', function (ev) {
        dispatch(domId, EVT.SPIN_DOWN);
        ev.stopPropagation();
      });
    } else if (el.dataset.wxScrollbar) {
      wireScrollbar(domId, el);
    } else if (!el.dataset.wxChrome) {
      el.addEventListener('click', function (ev) {
        dispatch(domId, EVT.CLICK);
        ev.stopPropagation();
      });
      el.addEventListener('focusin', function () {
        if (isEditable(valueEl)) {
          window.wxDomEditableFocused = 1;
        }
        dispatch(domId, EVT.FOCUSIN);
      });
      el.addEventListener('focusout', function () {
        if (isEditable(valueEl)) {
          window.wxDomEditableFocused = 0;
        }
        dispatch(domId, EVT.FOCUSOUT);
      });

      valueEl.addEventListener('input', function () {
        dispatch(domId, EVT.INPUT);
      });
      valueEl.addEventListener('change', function () {
        dispatch(domId, EVT.CHANGE);
      });
      if (isEditable(valueEl)) {
        valueEl.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' && valueEl.tagName === 'INPUT') {
            dispatch(domId, EVT.ENTER);
          } else if (valueEl.tagName === 'INPUT' && NAV_KEY_EVT[ev.key] &&
                     !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
            // Fire-and-forget: wx_dom_event is a promising export, so the
            // browser default (caret to start/end) cannot be gated on the
            // handler's answer — harmless in a single-line input.
            dispatch(domId, NAV_KEY_EVT[ev.key]);
          }
          // Typing belongs to the input; don't let the window-level
          // Emscripten keyboard handler see it (belt — the C++ callback
          // also checks wxDomEditableFocused as suspenders).
          ev.stopPropagation();
        });
        valueEl.addEventListener('keyup', function (ev) {
          ev.stopPropagation();
        });
      }
    }

    controls.set(domId, el);
    container.appendChild(el);
    return domId;
  };

  window.wxDomDestroyControl = function (domId) {
    var el = controls.get(domId);
    if (el) {
      if (el.dataset.wxDatalist) {
        var dl = document.getElementById(el.dataset.wxDatalist);
        if (dl) dl.remove();
      }
      el.remove();
      controls.delete(domId);
      inputs.delete(domId);
      labels.delete(domId);
      // drop this control's mirrored e2e-registry entries (tabs, spin
      // arrows, text fields)
      var reg = window.wxElementRegistry;
      if (reg && reg.renderedElements) {
        var stale = [];
        reg.renderedElements.forEach(function (info, key) {
          if (String(key).indexOf(domId + ':') === 0) stale.push(key);
        });
        stale.forEach(function (key) { reg.unregisterRendered(key); });
      }
    }
  };

  window.wxDomSetRect = function (domId, x, y, w, h) {
    var el = controls.get(domId);
    if (!el) return;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    // A control that moves under (or out from under) an open secondary window
    // changes the input-barrier geometry — wx.js recomputes it (rAF-coalesced).
    wxScheduleBarrierRecompute();
    // Notebook tabs register their viewport rects in the e2e registry;
    // unlike canvas tabs they don't repaint on move, so re-sync here.
    if (el.dataset.wxNotebook && el._wxTabs) {
      scheduleTabRegistry(domId, el);
    }
    // Same for spin arrows and text fields (the canvas port published
    // them from paint hooks; DOM controls don't repaint on move).
    if (el.dataset.wxSpin || el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA') {
      scheduleControlRegistry(domId, el);
    }
    // Scrollbars re-flow the thumb to the new track length, then re-publish
    // their drag targets to the e2e registry.
    if (el.dataset.wxScrollbar) {
      layoutScrollbar(el);
      scheduleScrollbarRegistry(domId, el);
    }
  };

  // Label text: routed to the inner label element for composites
  // (checkbox/radio span, statbox legend), the element itself otherwise.
  window.wxDomSetText = function (domId, text) {
    var target = labels.get(domId) || controls.get(domId);
    if (target) target.textContent = text;
  };

  window.wxDomSetValue = function (domId, value) {
    var el = inputs.get(domId) || controls.get(domId);
    if (el) el.value = value;
  };

  window.wxDomGetValue = function (domId) {
    var el = inputs.get(domId) || controls.get(domId);
    return el ? String(el.value) : '';
  };

  // Boolean state: checkbox/radio checked, toggle button pressed.
  window.wxDomSetBoolValue = function (domId, on) {
    var el = inputs.get(domId) || controls.get(domId);
    if (!el) return;
    if (el.tagName === 'INPUT') {
      el.checked = !!on;
    } else {
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      el.style.background = on ? '#b0c4de' : '';
    }
  };

  window.wxDomGetBoolValue = function (domId) {
    var el = inputs.get(domId) || controls.get(domId);
    if (!el) return 0;
    if (el.tagName === 'INPUT') return el.checked ? 1 : 0;
    return el.getAttribute('aria-pressed') === 'true' ? 1 : 0;
  };

  // Numeric state: gauge/slider value, select/radiobox/combobox selection.
  window.wxDomSetIntValue = function (domId, value) {
    var el = inputs.get(domId) || controls.get(domId);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      el.selectedIndex = value;
    } else if (el.dataset && el.dataset.wxRadioBox) {
      var radios = el.querySelectorAll('input[type=radio]');
      if (radios[value]) radios[value].checked = true;
    } else if (el.dataset && el.dataset.wxDatalist) {
      // combobox selection = the nth datalist option's text
      var dl = document.getElementById(el.dataset.wxDatalist);
      var opt = dl && dl.options[value];
      if (opt) el.value = opt.value;
    } else if (el.dataset && el.dataset.wxScrollbar) {
      // scrollbar thumb position (wxScrollBar::SetThumbPosition). Ignore
      // programmatic moves mid-drag — the user owns the thumb then.
      if (el._wxSb && !el._wxSb.dragging) {
        el._wxSb.pos = value;
        layoutScrollbar(el);
      }
    } else {
      el.value = value;
    }
  };

  window.wxDomGetIntValue = function (domId) {
    var el = inputs.get(domId) || controls.get(domId);
    if (!el) return 0;
    if (el.dataset && el.dataset.wxScrollbar) {
      return el._wxSb ? el._wxSb.pos : 0;
    }
    if (el.tagName === 'SELECT') return el.selectedIndex;
    if (el.dataset && el.dataset.wxRadioBox) {
      var radios = el.querySelectorAll('input[type=radio]');
      for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) return i;
      }
      return -1;
    }
    if (el.dataset && el.dataset.wxCheckList) {
      // index of the row whose checkbox last toggled (for wxEVT_CHECKLISTBOX)
      var t = parseInt(el.dataset.wxLastToggled, 10);
      return isNaN(t) ? -1 : t;
    }
    if (el.dataset && el.dataset.wxDatalist) {
      // combobox selection = index of the option matching the current text
      var dl = document.getElementById(el.dataset.wxDatalist);
      if (dl) {
        for (var j = 0; j < dl.options.length; j++) {
          if (dl.options[j].value === el.value) return j;
        }
      }
      return -1;
    }
    var v = parseInt(el.value, 10);
    return isNaN(v) ? 0 : v;
  };

  window.wxDomSetRange = function (domId, minVal, maxVal) {
    var el = inputs.get(domId) || controls.get(domId);
    if (!el) return;
    if (el.tagName === 'PROGRESS') {
      el.max = maxVal;
    } else {
      el.min = minVal;
      el.max = maxVal;
    }
  };

  // ========== Scrollbars (track + draggable thumb) ==========
  //
  // One shared widget backs both the standalone wxScrollBar and a wxWindow's
  // built-in gutters. C++ feeds (pos, thumb, range, page) + orientation via
  // wxDomSetScrollbar; drags report position + phase back through
  // wxDOM_EVENT_SCROLL (read with wxDomGetIntValue / wxDomGetScrollPhase).
  //
  // wx scrollbar semantics: `thumb` is the visible portion (the thumb's
  // proportion of the track is thumb/range), `pos` ranges 0..range-thumb,
  // and `page` is the track-click step. Auto-hide when thumb >= range.

  // Position the thumb for the current metrics; auto-hide when nothing scrolls.
  function layoutScrollbar(el) {
    var sb = el._wxSb;
    if (!sb) return;
    var track = el.querySelector('.wx-sb-track');
    var thumb = el.querySelector('.wx-sb-thumb');
    if (!track || !thumb) return;

    var trackPx = sb.vertical ? track.clientHeight : track.clientWidth;
    if (sb.range <= 0 || sb.thumb <= 0 || sb.thumb >= sb.range || trackPx <= 0) {
      thumb.style.display = 'none';
      return;
    }
    thumb.style.display = 'block';

    var thumbPx = Math.min(trackPx,
                           Math.max(12, Math.round(trackPx * sb.thumb / sb.range)));
    var scrollable = sb.range - sb.thumb;
    var pos = Math.max(0, Math.min(sb.pos, scrollable));
    var offsetPx = scrollable > 0
      ? Math.round((trackPx - thumbPx) * pos / scrollable) : 0;

    if (sb.vertical) {
      thumb.style.top = offsetPx + 'px';
      thumb.style.height = thumbPx + 'px';
    } else {
      thumb.style.left = offsetPx + 'px';
      thumb.style.width = thumbPx + 'px';
    }
  }

  // Map a thumb offset (px along the track) back to a scrollbar position.
  function scrollbarPosFromOffset(el, offsetPx) {
    var sb = el._wxSb;
    var track = el.querySelector('.wx-sb-track');
    var thumb = el.querySelector('.wx-sb-thumb');
    var trackPx = sb.vertical ? track.clientHeight : track.clientWidth;
    var thumbPx = sb.vertical ? thumb.offsetHeight : thumb.offsetWidth;
    var span = trackPx - thumbPx;
    var scrollable = sb.range - sb.thumb;
    if (span <= 0 || scrollable <= 0) return 0;
    return Math.max(0, Math.min(scrollable, Math.round(offsetPx / span * scrollable)));
  }

  function wireScrollbar(domId, el) {
    var sb = el._wxSb;
    var track = el.querySelector('.wx-sb-track');
    var thumb = el.querySelector('.wx-sb-thumb');

    thumb.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      sb.dragging = true;
      try { thumb.setPointerCapture(ev.pointerId); } catch (e) {}
      sb.dragStart = sb.vertical ? ev.clientY : ev.clientX;
      sb.dragStartOffset = sb.vertical ? thumb.offsetTop : thumb.offsetLeft;
    });
    thumb.addEventListener('pointermove', function (ev) {
      if (!sb.dragging) return;
      var delta = (sb.vertical ? ev.clientY : ev.clientX) - sb.dragStart;
      var newPos = scrollbarPosFromOffset(el, sb.dragStartOffset + delta);
      if (newPos !== sb.pos) {
        sb.pos = newPos;
        layoutScrollbar(el);
        sb.phase = 0; // thumbtrack
        dispatch(domId, EVT.SCROLL);
      }
    });
    var endDrag = function (ev) {
      if (!sb.dragging) return;
      sb.dragging = false;
      try { thumb.releasePointerCapture(ev.pointerId); } catch (e) {}
      sb.phase = 1; // thumbrelease
      dispatch(domId, EVT.SCROLL);
    };
    thumb.addEventListener('pointerup', endDrag);
    thumb.addEventListener('pointercancel', endDrag);

    // Track click outside the thumb = page step toward the click.
    track.addEventListener('pointerdown', function (ev) {
      if (ev.target === thumb || sb.range <= sb.thumb) return;
      var rect = track.getBoundingClientRect();
      var clickPos = sb.vertical ? (ev.clientY - rect.top) : (ev.clientX - rect.left);
      var thumbStart = sb.vertical ? thumb.offsetTop : thumb.offsetLeft;
      var dir = clickPos < thumbStart ? -1 : 1;
      var scrollable = sb.range - sb.thumb;
      var step = sb.page > 0 ? sb.page : sb.thumb;
      var newPos = Math.max(0, Math.min(scrollable, sb.pos + dir * step));
      if (newPos !== sb.pos) {
        sb.pos = newPos;
        layoutScrollbar(el);
        sb.phase = 2; // page step
        dispatch(domId, EVT.SCROLL);
      }
    });
  }

  // Push metrics from C++ (wxScrollBar / wxWindow built-in scrollbars).
  window.wxDomSetScrollbar = function (domId, pos, thumb, range, page) {
    var el = controls.get(domId);
    if (!el || !el._wxSb) return;
    var sb = el._wxSb;
    sb.thumb = thumb;
    sb.range = range;
    sb.page = page;
    if (!sb.dragging) sb.pos = pos; // the user owns the thumb mid-drag
    layoutScrollbar(el);
    scheduleScrollbarRegistry(domId, el);
  };

  // Phase of the last scroll interaction: 0 track, 1 release, 2 page.
  window.wxDomGetScrollPhase = function (domId) {
    var el = controls.get(domId);
    return el && el._wxSb ? (el._wxSb.phase | 0) : 0;
  };

  // Publish the thumb ('slider') and track ('slidertrack') to the e2e
  // registry so Playwright's dragSliderTo() can drag a scrollbar unchanged.
  // dragSliderTo reads screenX/screenY off the track, so map them explicitly
  // (rectInfo only carries x/y).
  function scheduleScrollbarRegistry(domId, el) {
    requestAnimationFrame(function () {
      var reg = window.wxElementRegistry;
      if (!reg || !el.isConnected || !el._wxSb) return;
      var stale = [];
      reg.renderedElements.forEach(function (info, key) {
        var k = String(key);
        if (k.indexOf(domId + ':slider:') === 0 ||
            k.indexOf(domId + ':slidertrack:') === 0) stale.push(key);
      });
      stale.forEach(function (key) { reg.unregisterRendered(key); });

      var track = el.querySelector('.wx-sb-track');
      var thumb = el.querySelector('.wx-sb-thumb');
      if (!track || !thumb || thumb.style.display === 'none') return;
      var sub = el._wxSb.vertical ? 'vertical' : 'horizontal';
      var tr = track.getBoundingClientRect();
      var th = thumb.getBoundingClientRect();
      registryRegister(domId + ':slidertrack:0', {
        elementType: 'slidertrack', subType: sub, label: '', tooltip: '',
        enabled: true, parentId: String(domId), index: 0,
        screenX: tr.x, screenY: tr.y, width: tr.width, height: tr.height,
        centerX: tr.x + tr.width / 2, centerY: tr.y + tr.height / 2
      });
      registryRegister(domId + ':slider:0', {
        elementType: 'slider', subType: sub, label: '', tooltip: '',
        enabled: true, parentId: String(domId), index: 0,
        screenX: th.x, screenY: th.y, width: th.width, height: th.height,
        centerX: th.x + th.width / 2, centerY: th.y + th.height / 2
      });
    });
  }

  // HTML radio exclusivity groups via the name attribute (wx groups are
  // defined by wxRB_GROUP chains; C++ passes a stable per-group name).
  window.wxDomSetGroupName = function (domId, name) {
    var el = inputs.get(domId);
    if (el) el.name = name;
  };

  // Item lists for select-likes and radiobox; items arrive \x1f-joined
  // (the unit separator can't occur in wx labels).
  window.wxDomSetItems = function (domId, joined) {
    var el = controls.get(domId);
    if (!el) return;
    var items = joined === '' ? [] : joined.split('\x1f');
    if (el.dataset.wxDatalist) {
      var dl = document.getElementById(el.dataset.wxDatalist);
      if (dl) {
        dl.textContent = '';
        items.forEach(function (it) {
          var o = document.createElement('option');
          o.value = it;
          dl.appendChild(o);
        });
      }
    } else if (el.dataset.wxCheckList) {
      el.textContent = '';
      items.forEach(function (it, idx) {
        var row = document.createElement('label');
        row.style.cssText =
          'display:flex;align-items:center;padding:0 2px;white-space:pre;';
        var inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.style.margin = '0 3px 0 0';
        inp.addEventListener('change', function () {
          el.dataset.wxLastToggled = String(idx);
          dispatch(domId, EVT.CHANGE);
        });
        var sp = document.createElement('span');
        sp.textContent = it;
        row.appendChild(inp);
        row.appendChild(sp);
        el.appendChild(row);
      });
    } else if (el.tagName === 'SELECT') {
      el.textContent = '';
      items.forEach(function (it) {
        var o = document.createElement('option');
        o.textContent = it;
        el.appendChild(o);
      });
    } else if (el.dataset.wxRadioBox) {
      Array.prototype.forEach.call(el.querySelectorAll('label'), function (r) {
        r.remove();
      });
      items.forEach(function (it) {
        var row = document.createElement('label');
        row.style.cssText =
          'display:flex;align-items:center;margin:1px 4px;white-space:pre;';
        var inp = document.createElement('input');
        inp.type = 'radio';
        inp.name = 'wxradiobox-' + domId;
        inp.style.margin = '0 3px 0 0';
        inp.addEventListener('change', function () {
          dispatch(domId, EVT.CHANGE);
        });
        var sp = document.createElement('span');
        sp.textContent = it;
        row.appendChild(inp);
        row.appendChild(sp);
        el.appendChild(row);
      });
    }
  };

  // Multi-selection (listbox) / per-item checked state (checklistbox):
  // per-index boolean; "selected" indices returned comma-joined.
  window.wxDomSetItemSelected = function (domId, index, on) {
    var el = controls.get(domId);
    if (!el) return;
    if (el.dataset.wxCheckList) {
      var boxes = el.querySelectorAll('input[type=checkbox]');
      if (boxes[index]) boxes[index].checked = !!on;
    } else if (el.tagName === 'SELECT' && el.options[index]) {
      el.options[index].selected = !!on;
    }
  };

  window.wxDomGetSelectedIndices = function (domId) {
    var el = controls.get(domId);
    if (!el) return '';
    var out = [];
    var i;
    if (el.dataset.wxCheckList) {
      var boxes = el.querySelectorAll('input[type=checkbox]');
      for (i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) out.push(i);
      }
    } else if (el.tagName === 'SELECT') {
      for (i = 0; i < el.options.length; i++) {
        if (el.options[i].selected) out.push(i);
      }
    }
    return out.join(',');
  };

  // Bitmap content as a PNG data URL: <img> roots directly; buttons get a
  // leading <img> child (note: wxDomSetText replaces children — C++ must
  // set the image after the label). Explicit w/h from the wx bitmap size:
  // images load asynchronously, so without them the measurement clone (and
  // hence DoGetBestSize) would see a 0x0 image.
  window.wxDomSetImage = function (domId, dataUrl, w, h) {
    var el = controls.get(domId);
    if (!el) return;
    var img;
    if (el.tagName === 'IMG') {
      img = el;
    } else {
      img = el.querySelector('img.wx-btn-img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'wx-btn-img';
        // keep the bitmap from being squashed inside the flex button
        img.style.flexShrink = '0';
        el.insertBefore(img, el.firstChild);
      }
    }
    if (w > 0) { img.width = w; img.style.width = w + 'px'; }
    if (h > 0) { img.height = h; img.style.height = h + 'px'; }
    img.src = dataUrl;
  };

  window.wxDomSetEnabled = function (domId, enabled) {
    var root = controls.get(domId);
    var el = inputs.get(domId) || root;
    if (!el) return;
    if ('disabled' in el) el.disabled = !enabled;
    if (root) root.style.opacity = enabled ? '' : '0.5';
  };

  window.wxDomSetReadOnly = function (domId, readOnly) {
    var el = inputs.get(domId) || controls.get(domId);
    if (el) el.readOnly = !!readOnly;
  };

  window.wxDomSetShown = function (domId, shown) {
    var el = controls.get(domId);
    if (el) el.style.display = shown ? (el.dataset.wxDisplay || '') : 'none';
  };

  window.wxDomFocus = function (domId) {
    var el = inputs.get(domId) || controls.get(domId);
    if (el && document.activeElement !== el) el.focus();
  };

  // Counterpart of wxDomFocus for wx focus moving to a canvas-drawn window
  // (wxWindowWasm::SetFocus): drop browser focus from the wx-dom control that
  // still has it, so keys go back to wx. Controls outside wx-dom (the host
  // page's own inputs) are never touched.
  window.wxDomBlurActive = function () {
    var ae = document.activeElement;
    if (ae && ae !== document.body && ae.closest && ae.closest('.wx-dom-control')) {
      ae.blur();
    }
  };

  window.wxDomSetFont = function (domId, cssFont) {
    var el = controls.get(domId);
    if (el && cssFont) el.style.font = cssFont;
  };

  window.wxDomSetAriaLabel = function (domId, label) {
    var el = controls.get(domId);
    if (el) el.setAttribute('aria-label', label);
  };

  window.wxDomSetTooltip = function (domId, tip) {
    var el = controls.get(domId);
    if (el) el.title = tip;
  };

  // Insets in CSS px relative to the element's own box; all <= 0 clears.
  // clip-path does not affect layout and clips hit-testing too, so rows
  // scrolled out of a pane neither paint nor catch clicks.
  window.wxDomSetClip = function (domId, top, right, bottom, left) {
    var el = controls.get(domId);
    if (!el) return;
    if (top <= 0 && right <= 0 && bottom <= 0 && left <= 0) {
      if (el.style.clipPath) el.style.clipPath = '';
    } else {
      el.style.clipPath = 'inset(' + Math.max(0, top) + 'px ' +
                          Math.max(0, right) + 'px ' +
                          Math.max(0, bottom) + 'px ' +
                          Math.max(0, left) + 'px)';
    }
  };

  // ========== Menus & toolbars ==========

  var openMenuPopup = null;

  function closeMenuPopup() {
    if (openMenuPopup) {
      openMenuPopup.remove();
      openMenuPopup = null;
    }
  }

  document.addEventListener('mousedown', function (ev) {
    // any click outside an open menu closes it (mousedown so the click on
    // another control still lands)
    if (openMenuPopup && !openMenuPopup.contains(ev.target)) {
      var inTitle = ev.target.closest && ev.target.closest('.wx-menu-title');
      if (!inTitle) closeMenuPopup();
    }
  });

  function registryRegister(id, info) {
    var reg = window.wxElementRegistry;
    if (reg && reg.registerRendered) reg.registerRendered(id, info);
  }

  function rectInfo(el) {
    var r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height,
             centerX: r.x + r.width / 2, centerY: r.y + r.height / 2 };
  }

  // Builds the item rows of a menu popup into `pop` (shared by the menubar
  // popups and the standalone context menu). items:
  // [{id,label,kind:'normal'|'separator'|'check'|'radio'|'submenu',
  //   checked,enabled,items}]. onChoose(id) fires for a leaf row click;
  // reopenSubmenu(row, subItems) handles a submenu row. Each row is
  // published to the e2e registry under registryParent as 'menuitem'.
  function buildMenuItemRows(pop, items, registryParent, onChoose, reopenSubmenu) {
    items.forEach(function (it, idx) {
      if (it.kind === 'separator') {
        var sep = document.createElement('div');
        sep.style.cssText = 'border-top:1px solid #808080;margin:2px 4px;';
        pop.appendChild(sep);
        return;
      }
      var row = document.createElement('div');
      row.textContent = (it.checked ? '✓ ' : '   ') + it.label +
                        (it.kind === 'submenu' ? '  ▸' : '');
      row.style.cssText = 'padding:2px 14px 2px 6px;cursor:default;' +
                          (it.enabled ? '' : 'color:#808080;');
      if (it.enabled) {
        row.addEventListener('mouseenter', function () {
          row.style.background = '#000080';
          row.style.color = '#ffffff';
        });
        row.addEventListener('mouseleave', function () {
          row.style.background = '';
          row.style.color = '';
        });
        row.addEventListener('click', function (ev) {
          ev.stopPropagation();
          if (it.kind === 'submenu') {
            reopenSubmenu(row, it.items || []);
            return;
          }
          onChoose(it.id);
        });
      }
      pop.appendChild(row);
      // register popup items for the e2e registry (canvas parity)
      requestAnimationFrame(function () {
        if (!pop.isConnected) return;
        registryRegister(registryParent + ':menuitem:' + idx, Object.assign({
          elementType: 'menuitem',
          subType: it.kind === 'check' || it.kind === 'radio' ? it.kind : 'normal',
          label: it.label, tooltip: '', enabled: !!it.enabled,
          parentId: registryParent, index: idx
        }, rectInfo(row)));
      });
    });
  }

  // Builds and shows the popup for one menubar menu's items below `anchor`.
  function showMenuPopup(domId, anchor, items, registryParent) {
    closeMenuPopup();
    var pop = document.createElement('div');
    pop.className = 'wx-menu-popup';
    var a = anchor.getBoundingClientRect();
    pop.style.cssText =
      'position:absolute;z-index:10000;background:#d4d0c8;' +
      'border:1px solid #808080;box-shadow:2px 2px 4px rgba(0,0,0,.3);' +
      'padding:2px;white-space:pre;min-width:120px;' +
      'left:' + (a.left + window.scrollX) + 'px;' +
      'top:' + (a.bottom + window.scrollY) + 'px;';
    pop.style.font = anchor.style.font || getComputedStyle(anchor).font;

    buildMenuItemRows(pop, items, registryParent,
      function (id) {
        var bar = controls.get(domId);
        if (bar) bar.dataset.wxLastCommand = String(id);
        closeMenuPopup();
        dispatch(domId, EVT.MENU);
      },
      function (row, subItems) {
        // simple inline expansion: replace popup with the submenu
        showMenuPopup(domId, row, subItems, registryParent);
      });

    document.body.appendChild(pop);
    openMenuPopup = pop;
  }

  // ========== Context menu (wxWindow::PopupMenu -> DoPopupMenu) ==========
  //
  // Shows a standalone popup at a viewport point and BLOCKS the synchronous
  // C++ DoPopupMenu: the EM_ASYNC_JS wxDomPopupMenuModal in
  // src/wasm/window.cpp awaits the returned Promise, which resolves with the
  // chosen command id (-1 = cancelled). The top-level tick keeps dispatching
  // and painting while the opener's chain is parked. json: the wxMenu
  // serialized by wxMenu::WasmItemsToJson(). x/y in viewport px, or -1
  // (wxDefaultCoord) to use the last pointer position (the KiCad canvas
  // right-click case).
  Module['wxShowContextMenu'] = function (json, invokerDomId, x, y) {
    var items;
    try {
      items = JSON.parse(json);
    } catch (e) {
      console.error('wxShowContextMenu: bad JSON: ' + e.message);
      return Promise.resolve(-1);
    }

    var vx = x, vy = y;
    if (x === -1 || y === -1) {
      vx = lastPointerClientX;
      vy = lastPointerClientY;
    } else {
      var inv = controls.get(invokerDomId);
      if (inv) {
        var ir = inv.getBoundingClientRect();
        vx = ir.left + x; vy = ir.top + y;
      } else if (Module['canvas']) {
        var cr = Module['canvas'].getBoundingClientRect();
        vx = cr.left + x; vy = cr.top + y;
      }
    }

    closeMenuPopup(); // a context menu supersedes any open menubar popup

    var pop = document.createElement('div');
    pop.className = 'wx-menu-popup';
    pop.style.cssText =
      'position:fixed;z-index:10000;background:#d4d0c8;' +
      'border:1px solid #808080;box-shadow:2px 2px 4px rgba(0,0,0,.3);' +
      'padding:2px;white-space:pre;min-width:120px;left:0;top:0;';
    if (Module['canvas']) {
      pop.style.font = getComputedStyle(Module['canvas']).font;
    }

    return new Promise(function (resolve) {
      var settled = false;
      function settle(id) {
        if (settled) return;
        settled = true;
        document.removeEventListener('mousedown', onOutside, true);
        document.removeEventListener('keydown', onKey, true);
        if (pop.parentNode) pop.remove();
        if (openMenuPopup === pop) openMenuPopup = null;
        // Drop the popup's e2e-registry entries so the dismissal is observable
        // (the rows are gone from the DOM; their geometry is now stale).
        var reg = window.wxElementRegistry;
        if (reg && reg.unregisterRenderedByParent)
          reg.unregisterRenderedByParent('popupmenu');
        resolve(id);
      }
      function onOutside(ev) { if (!pop.contains(ev.target)) settle(-1); }
      function onKey(ev) {
        if (ev.key === 'Escape') { ev.stopPropagation(); settle(-1); }
      }

      // reopenSubmenu rebuilds the rows in place for a chosen submenu.
      function makeReopen() {
        return function (row, subItems) {
          pop.textContent = '';
          buildMenuItemRows(pop, subItems, 'popupmenu',
            function (id) { settle(id); }, makeReopen());
        };
      }
      buildMenuItemRows(pop, items, 'popupmenu',
        function (id) { settle(id); }, makeReopen());

      document.body.appendChild(pop);
      openMenuPopup = pop;

      // Clamp to the viewport: flip left/up when overflowing an edge.
      var w = pop.offsetWidth, h = pop.offsetHeight;
      var L = vx, T = vy;
      if (L + w > window.innerWidth) L = Math.max(0, vx - w);
      if (T + h > window.innerHeight) T = Math.max(0, vy - h);
      pop.style.left = L + 'px';
      pop.style.top = T + 'px';

      document.addEventListener('mousedown', onOutside, true);
      document.addEventListener('keydown', onKey, true);

      // NO popup pump (docs/features/async/17 S4): the top-level tick is the
      // sole dispatcher and keeps the app painting while DoPopupMenu's chain
      // is suspended. The menu itself is DOM, its events dispatch as fresh
      // entries.
    });
  };

  // structureJson: [{title, items:[...]}, ...] (schema above)
  window.wxDomMenuSetStructure = function (domId, structureJson) {
    var el = controls.get(domId);
    if (!el || !el.dataset.wxMenuBar) return;
    var menus;
    try {
      menus = JSON.parse(structureJson);
    } catch (e) {
      console.error('wxDomMenuSetStructure: bad JSON: ' + e.message);
      return;
    }
    el.textContent = '';
    closeMenuPopup();
    menus.forEach(function (m, idx) {
      var btn = document.createElement('button');
      btn.className = 'wx-menu-title';
      btn.textContent = m.title;
      btn.style.cssText =
        'border:none;background:transparent;padding:2px 8px;margin:0;' +
        'font:inherit;white-space:pre;';
      btn.addEventListener('mousedown', function (ev) { ev.stopPropagation(); });
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (openMenuPopup) {
          closeMenuPopup();
        } else {
          showMenuPopup(domId, btn, m.items || [], domId + ':' + idx);
        }
      });
      el.appendChild(btn);
      requestAnimationFrame(function () {
        registryRegister(domId + ':menubartitle:' + idx, Object.assign({
          elementType: 'menuitem', subType: 'menubar',
          label: m.title, tooltip: '', enabled: true,
          parentId: String(domId), index: idx
        }, rectInfo(btn)));
      });
    });
  };

  // tools: [{id,label,tooltip,kind:'button'|'toggle'|'separator',
  //          toggled,enabled,img,imgW,imgH}]
  window.wxDomToolbarSetTools = function (domId, toolsJson) {
    var el = controls.get(domId);
    if (!el || !el.dataset.wxToolBar) return;
    var tools;
    try {
      tools = JSON.parse(toolsJson);
    } catch (e) {
      console.error('wxDomToolbarSetTools: bad JSON', e);
      return;
    }
    el.textContent = '';
    tools.forEach(function (t, idx) {
      if (t.kind === 'separator') {
        var sep = document.createElement('div');
        sep.style.cssText =
          'border-left:1px solid #808080;align-self:stretch;margin:1px 3px;';
        el.appendChild(sep);
        return;
      }
      var btn = document.createElement('button');
      btn.className = 'wx-tool';
      // same look as every other tooltip (no native title attribute)
      tooltipHover(btn, function () { return t.tooltip || t.label || ''; });
      btn.style.cssText = 'padding:1px 3px;margin:1px;font:inherit;' +
                          'display:flex;align-items:center;';
      if (t.img) {
        var img = document.createElement('img');
        if (t.imgW > 0) { img.width = t.imgW; img.style.width = t.imgW + 'px'; }
        if (t.imgH > 0) { img.height = t.imgH; img.style.height = t.imgH + 'px'; }
        img.style.flexShrink = '0';
        img.src = t.img;
        btn.appendChild(img);
      } else {
        btn.textContent = t.label || '';
      }
      btn.disabled = !t.enabled;
      if (t.toggled) btn.style.background = '#b0c4de';
      // Styling hook only (dark theme CSS keys off it) — the light look
      // stays inline above.
      if (t.toggled) btn.dataset.wxToggled = '1';
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        el.dataset.wxLastCommand = String(t.id);
        dispatch(domId, EVT.TOOL);
      });
      el.appendChild(btn);
      requestAnimationFrame(function () {
        if (!btn.isConnected) return;
        registryRegister(domId + ':tool:' + idx, Object.assign({
          elementType: 'tool', subType: t.kind === 'toggle' ? 'toggle' : 'button',
          label: t.label || '', tooltip: t.tooltip || '', enabled: !!t.enabled,
          parentId: String(domId), index: idx, toggled: !!t.toggled
        }, rectInfo(btn)));
      });
    });
  };

  // Command id of the last activated menu item / tool (set by the click
  // handlers above; read by wxMenuBar/wxToolBar OnDomEvent).
  window.wxDomGetLastCommandId = function (domId) {
    var el = controls.get(domId);
    var v = el ? parseInt(el.dataset.wxLastCommand, 10) : NaN;
    return isNaN(v) ? -1 : v;
  };

  // ========== Notebook tab strip ==========

  // (Re-)register the strip's tabs in the e2e registry: elementType 'tab',
  // subType 'selected'/'button' — the same contract the canvas port's
  // notebook keeps, so clickTab() works unchanged.
  function scheduleTabRegistry(domId, el) {
    requestAnimationFrame(function () {
      var reg = window.wxElementRegistry;
      if (!reg || !el.isConnected || !el._wxTabs) return;
      var stale = [];
      reg.renderedElements.forEach(function (info, key) {
        if (String(key).indexOf(domId + ':tab:') === 0) stale.push(key);
      });
      stale.forEach(function (key) { reg.unregisterRendered(key); });
      var buttons = el.querySelectorAll('.wx-tab-strip > button');
      el._wxTabs.forEach(function (tab, idx) {
        var btn = buttons[idx];
        if (!btn) return;
        registryRegister(domId + ':tab:' + idx, Object.assign({
          elementType: 'tab',
          subType: tab.selected ? 'selected' : 'button',
          label: tab.label, tooltip: '', enabled: true,
          parentId: String(domId), index: idx
        }, rectInfo(btn)));
      });
    });
  }

  // Mirror DOM-native controls the canvas port used to publish from its
  // paint hooks as "rendered elements": spin arrows ('spinbutton',
  // subType up/down) and text fields ('textctrl', subType
  // singleline/multiline). Keeps clickSpinUp()/findSingleLineTextCtrl()
  // and friends working against the same registry contract.
  function scheduleControlRegistry(domId, el) {
    requestAnimationFrame(function () {
      var reg = window.wxElementRegistry;
      if (!reg || !el.isConnected) return;
      var stale = [];
      reg.renderedElements.forEach(function (info, key) {
        var k = String(key);
        if (k.indexOf(domId + ':spinbutton:') === 0 ||
            k.indexOf(domId + ':textctrl:') === 0) stale.push(key);
      });
      stale.forEach(function (key) { reg.unregisterRendered(key); });

      if (el.dataset.wxSpin) {
        var arrows = [
          { sel: '.wx-spin-up', sub: 'up', idx: 0 },
          { sel: '.wx-spin-down', sub: 'down', idx: 1 }
        ];
        arrows.forEach(function (a) {
          var btn = el.querySelector(a.sel);
          if (!btn) return;
          registryRegister(domId + ':spinbutton:' + a.idx, Object.assign({
            elementType: 'spinbutton', subType: a.sub,
            label: '', tooltip: '', enabled: !btn.disabled,
            parentId: String(domId), index: a.idx
          }, rectInfo(btn)));
        });
        return;
      }

      // text fields: plain <input type=text|password> (a datalist combo
      // is not a textctrl) and <textarea>
      var isText = el.tagName === 'TEXTAREA' ||
                   (el.tagName === 'INPUT' &&
                    (el.type === 'text' || el.type === 'password') &&
                    !el.hasAttribute('list'));
      if (isText) {
        registryRegister(domId + ':textctrl:0', Object.assign({
          elementType: 'textctrl',
          subType: el.tagName === 'TEXTAREA' ? 'multiline' : 'singleline',
          label: el.getAttribute('aria-label') || '',
          tooltip: '', enabled: !el.disabled,
          parentId: String(domId), index: 0
        }, rectInfo(el)));
      }
    });
  }

  // tabsJson: [{label, selected}] — tab id == array index.
  window.wxDomNotebookSetTabs = function (domId, tabsJson) {
    var el = controls.get(domId);
    if (!el || !el.dataset.wxNotebook) return;
    var tabs;
    try {
      tabs = JSON.parse(tabsJson);
    } catch (e) {
      console.error('wxDomNotebookSetTabs: bad JSON: ' + e.message);
      return;
    }
    var strip = el.querySelector('.wx-tab-strip');
    if (!strip) return;
    strip.textContent = '';
    tabs.forEach(function (tab, idx) {
      var btn = document.createElement('button');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', tab.selected ? 'true' : 'false');
      btn.textContent = tab.label;
      btn.style.cssText =
        'font:inherit;margin:1px 0 0 1px;padding:2px 8px;' +
        'border:1px solid #808080;border-bottom:none;' +
        'border-radius:3px 3px 0 0;white-space:pre;' +
        'overflow:hidden;text-overflow:ellipsis;' +
        'flex:0 1 auto;min-width:0;cursor:default;' +
        (tab.selected
          ? 'background:#f5f4f2;font-weight:bold;position:relative;top:1px;'
          : 'background:#c8c4bc;');
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        el.dataset.wxLastCommand = String(idx);
        dispatch(domId, EVT.TAB);
      });
      strip.appendChild(btn);
    });
    el._wxTabs = tabs;
    scheduleTabRegistry(domId, el);
  };

  // Tab strip height for the C++ client-area math; clone-measured so it
  // works while the notebook (or an ancestor) is display:none.
  window.wxDomNotebookStripHeight = function (domId) {
    var el = controls.get(domId);
    if (!el) return 0;
    var strip = el.querySelector('.wx-tab-strip');
    if (!strip) return 0;
    var r = strip.getBoundingClientRect();
    if (r.height > 0) return Math.ceil(r.height);
    // hidden: measure a clone off-screen
    var clone = strip.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-100000px';
    clone.style.top = '0';
    clone.style.right = 'auto';
    clone.style.visibility = 'hidden';
    clone.style.display = 'flex';
    document.body.appendChild(clone);
    var h = clone.getBoundingClientRect().height;
    clone.remove();
    return Math.max(0, Math.ceil(h));
  };

  // Intrinsic (content-driven) size, packed (w << 16) | h for EM_ASM_INT.
  // Measured on a CLONE inside an always-rendered offscreen host: sizers run
  // DoGetBestSize before the frame is shown, when the element (or any
  // ancestor TLW div) is display:none and would measure 0x0.
  var measureHost = null;
  window.wxDomIntrinsicSize = function (domId) {
    var el = controls.get(domId);
    if (!el) return 0;

    if (!measureHost) {
      measureHost = document.createElement('div');
      measureHost.style.cssText =
        'position:absolute;left:-100000px;top:0;visibility:hidden;';
      document.body.appendChild(measureHost);
    }

    var clone = el.cloneNode(true); // copies inline styles incl. font
    clone.style.display = el.dataset.wxDisplay || 'block';
    clone.style.position = 'static';
    clone.style.width = 'auto';
    clone.style.height = 'auto';
    // shrink-to-fit so the width reflects the content, not the host
    clone.style.inlineSize = 'fit-content';
    measureHost.appendChild(clone);
    var rect = clone.getBoundingClientRect();
    clone.remove();

    var w = Math.min(0xffff, Math.max(1, Math.ceil(rect.width)));
    var h = Math.min(0xffff, Math.max(1, Math.ceil(rect.height)));
    return (w << 16) | h;
  };

  // ========== Tooltip layer ==========
  //
  // One port-rendered tooltip for everything: DOM-backed widgets AND
  // canvas-island widgets (which have no element to carry a title
  // attribute). Driven from C++ (src/wasm/tooltip.cpp) off the mouse
  // pipeline's hover hit-test; toolbar buttons/menu titles use the
  // JS-side tooltipHover() since they aren't wx windows.

  var tooltipEl = null;
  var tooltipHoverTimer = null;

  function ensureTooltipEl() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'wx-tooltip';
      tooltipEl.style.cssText =
        'position:fixed;z-index:20000;display:none;' +
        'background:#ffffe1;color:#000;border:1px solid #000;' +
        'padding:2px 4px;font:12px sans-serif;white-space:pre;' +
        'pointer-events:none;max-width:400px;';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  // x/y: #canvas-relative (wx screen) coordinates.
  window.wxDomTooltipShow = function (text, x, y) {
    if (!text) return;
    var el = ensureTooltipEl();
    var c = Module['canvas'];
    var base = c ? c.getBoundingClientRect() : { left: 0, top: 0 };
    el.textContent = text;
    el.style.display = 'block';
    var px = base.left + x + 2;
    var py = base.top + y + 18;
    el.style.left = '0px';
    el.style.top = '0px';
    var r = el.getBoundingClientRect();
    if (px + r.width > window.innerWidth - 4) {
      px = Math.max(4, window.innerWidth - r.width - 4);
    }
    if (py + r.height > window.innerHeight - 4) {
      py = base.top + y - r.height - 6;
    }
    el.style.left = px + 'px';
    el.style.top = py + 'px';
  };

  window.wxDomTooltipHide = function () {
    if (tooltipEl) tooltipEl.style.display = 'none';
    if (tooltipHoverTimer) {
      clearTimeout(tooltipHoverTimer);
      tooltipHoverTimer = null;
    }
  };

  // Any press/keystroke/scroll dismisses the tooltip (capture phase so
  // stopPropagation in control listeners can't keep it alive).
  ['mousedown', 'keydown', 'wheel'].forEach(function (evName) {
    document.addEventListener(evName, function () {
      if (tooltipEl && tooltipEl.style.display !== 'none') {
        tooltipEl.style.display = 'none';
      }
    }, true);
  });

  // Hover tooltips for JS-built surfaces that aren't wx windows
  // (toolbar tool buttons). getText is read at fire time.
  function tooltipHover(el, getText) {
    el.addEventListener('mouseenter', function (ev) {
      if (tooltipHoverTimer) clearTimeout(tooltipHoverTimer);
      tooltipHoverTimer = setTimeout(function () {
        var text = getText();
        if (!text) return;
        var c = Module['canvas'];
        var base = c ? c.getBoundingClientRect() : { left: 0, top: 0 };
        window.wxDomTooltipShow(text,
                                Math.round(ev.clientX - base.left),
                                Math.round(ev.clientY - base.top));
      }, 600);
    });
    el.addEventListener('mouseleave', function () {
      window.wxDomTooltipHide();
    });
  }

  // ========== Input forwarding: DOM layer → wx pipeline ==========
  //
  // The wx mouse pipeline (hit-testing, ENTER/LEAVE hover synthesis,
  // wheel scrolling, capture) is fed by Emscripten callbacks on #canvas.
  // DOM controls swallow browser events before #canvas sees them, so the
  // pipeline goes blind whenever the pointer is over a DOM element.
  // These document-level listeners (bubble phase) forward the events wx
  // needs into wx_dom_mouse (src/wasm/domevents.cpp), which re-enters the
  // SAME C++ path.
  //
  // Invariants (prevent double dispatch):
  //  - events targeting #canvas take only the Emscripten path;
  //  - events targeting DOM controls take only this path;
  //  - LEFT clicks on interactive controls take only the native control
  //    path (their click listeners + wx_dom_event); we forward left
  //    clicks only for passive controls (dataset.wxPassive: statictext,
  //    gauge), middle/right always.
  // NOTE: listeners that stopPropagation on mousedown (menubar titles)
  // intentionally opt out of forwarding.

  var canvasRect = null;
  window.addEventListener('resize', function () { canvasRect = null; });

  function wxForwardMouse(ev, kind, deltaY) {
    var c = Module['canvas'];
    if (!c) return 0;
    if (!canvasRect) canvasRect = c.getBoundingClientRect();
    var mods = (ev.ctrlKey ? 1 : 0) | (ev.shiftKey ? 2 : 0) |
               (ev.altKey ? 4 : 0) | (ev.metaKey ? 8 : 0);
    try {
      return Module['ccall']('wx_dom_mouse', 'number',
        ['number', 'number', 'number', 'number',
         'number', 'number', 'number', 'number'],
        [kind,
         Math.round(ev.clientX - canvasRect.left),
         Math.round(ev.clientY - canvasRect.top),
         ev.button | 0, ev.buttons | 0, ev.detail | 0, mods, deltaY || 0]);
    } catch (e) {
      return 0;
    }
  }

  function forwardTarget(ev) {
    var t = ev.target;
    if (!t || t === Module['canvas'] || !t.closest) return null;
    if (t.closest('.wx-menu-popup')) return null;
    return t.closest('.wx-dom-control');
  }

  // Track the pointer everywhere (capture phase, including over the GAL
  // canvas where forwardTarget is null) so a "popup at the mouse" context
  // menu lands at the cursor.
  function trackPointer(ev) {
    lastPointerClientX = ev.clientX;
    lastPointerClientY = ev.clientY;
  }
  document.addEventListener('mousemove', trackPointer, true);
  document.addEventListener('mousedown', trackPointer, true);
  document.addEventListener('contextmenu', trackPointer, true);

  document.addEventListener('mousemove', function (ev) {
    if (forwardTarget(ev)) wxForwardMouse(ev, 1, 0);
  });

  document.addEventListener('mousedown', function (ev) {
    var ctl = forwardTarget(ev);
    if (!ctl) return;
    if (ev.button !== 0 || ctl.dataset.wxPassive) wxForwardMouse(ev, 2, 0);
  });

  document.addEventListener('mouseup', function (ev) {
    var ctl = forwardTarget(ev);
    if (!ctl) return;
    if (ev.button !== 0 || ctl.dataset.wxPassive) wxForwardMouse(ev, 3, 0);
  });

  document.addEventListener('wheel', function (ev) {
    var ctl = forwardTarget(ev);
    if (!ctl) return;
    // A natively scrollable element under the cursor (textarea, multi-
    // select, checklist) keeps its own wheel behavior.
    for (var n = ev.target; n; n = n.parentElement) {
      var oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') &&
          n.scrollHeight > n.clientHeight) {
        return;
      }
      if (n === ctl) break;
    }
    if (wxForwardMouse(ev, 4, ev.deltaY)) ev.preventDefault();
  }, { passive: false });

  document.addEventListener('contextmenu', function (ev) {
    var ctl = forwardTarget(ev);
    if (!ctl) return;
    var t = ev.target;
    var editable = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
                         t.isContentEditable);
    // wx already received the right-click via the forwarded mousedown/up;
    // suppress the browser menu except over editables (keep native paste).
    if (!editable) ev.preventDefault();
  });
})();
