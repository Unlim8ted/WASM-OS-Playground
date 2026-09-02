// Element Registry for E2E Tests
// Tracks all wxWindow instances with their positions for automated testing
(function() {
  if (typeof window !== 'undefined' && typeof window.wxElementRegistry === 'undefined') {
    window.wxElementRegistry = {
      elements: new Map(),
      version: 0,

      register: function(id, info) {
        this.elements.set(id, info);
        this.version++;
      },

      update: function(id, updates) {
        var elem = this.elements.get(id);
        if (elem) {
          Object.assign(elem, updates);
          elem.lastUpdated = Date.now();
          this.version++;
        }
      },

      unregister: function(id) {
        this.elements.delete(id);
        this.version++;
      },

      findByLabel: function(label, options) {
        options = options || {};
        var results = [];
        var exact = options.exact || false;
        var visibleOnly = options.visible !== false;

        this.elements.forEach(function(elem) {
          if (visibleOnly && !elem.visible) return;
          if (options.enabled && !elem.enabled) return;
          if (options.type && elem.typeName !== options.type) return;

          var matches = exact
            ? elem.label === label
            : elem.label.indexOf(label) !== -1;
          if (matches) results.push(elem);
        });

        return results;
      },

      findByName: function(name, options) {
        options = options || {};
        var results = [];
        var exact = options.exact || false;
        var visibleOnly = options.visible !== false;

        this.elements.forEach(function(elem) {
          if (visibleOnly && !elem.visible) return;
          if (options.enabled && !elem.enabled) return;
          if (options.type && elem.typeName !== options.type) return;

          var matches = exact
            ? elem.name === name
            : elem.name.indexOf(name) !== -1;
          if (matches) results.push(elem);
        });

        return results;
      },

      findByType: function(typeName, options) {
        options = options || {};
        var results = [];
        var visibleOnly = options.visible !== false;

        this.elements.forEach(function(elem) {
          if (visibleOnly && !elem.visible) return;
          if (options.enabled && !elem.enabled) return;
          if (elem.typeName === typeName) results.push(elem);
        });

        return results;
      },

      findAll: function(filter) {
        filter = filter || {};
        var results = [];
        var visibleOnly = filter.visible !== false;

        this.elements.forEach(function(elem) {
          if (visibleOnly && !elem.visible) return;
          if (filter.enabled && !elem.enabled) return;
          if (filter.type && elem.typeName !== filter.type) return;
          if (filter.label && elem.label.indexOf(filter.label) === -1) return;
          if (filter.name && elem.name.indexOf(filter.name) === -1) return;
          results.push(elem);
        });

        return results;
      },

      getElement: function(id) {
        return this.elements.get(id) || null;
      },

      dump: function() {
        console.log('[wxElementRegistry] Elements:', this.elements.size);
        this.elements.forEach(function(elem) {
          console.log('  ' + elem.id + ': ' + elem.typeName + ' "' + elem.label + '" at (' + elem.screenX + ',' + elem.screenY + ') ' + elem.width + 'x' + elem.height);
        });
      },

      getStats: function() {
        var stats = { total: 0, byType: {} };
        this.elements.forEach(function(elem) {
          stats.total++;
          stats.byType[elem.typeName] = (stats.byType[elem.typeName] || 0) + 1;
        });
        return stats;
      },

      // ========== Rendered Elements (toolbar tools, menu items, etc.) ==========
      renderedElements: new Map(),
      renderedVersion: 0,

      registerRendered: function(id, info) {
        this.renderedElements.set(id, info);
        this.renderedVersion++;
      },

      updateRendered: function(id, updates) {
        var elem = this.renderedElements.get(id);
        if (elem) {
          Object.assign(elem, updates);
          elem.lastUpdated = Date.now();
          this.renderedVersion++;
        }
      },

      unregisterRendered: function(id) {
        this.renderedElements.delete(id);
        this.renderedVersion++;
      },

      unregisterRenderedByParent: function(parentId) {
        var toDelete = [];
        var self = this;
        this.renderedElements.forEach(function(elem, key) {
          if (elem.parentId === parentId) {
            toDelete.push(key);
          }
        });
        toDelete.forEach(function(key) {
          self.renderedElements.delete(key);
        });
        if (toDelete.length > 0) this.renderedVersion++;
      },

      findRenderedByLabel: function(label, options) {
        options = options || {};
        var results = [];
        var exact = options.exact || false;

        this.renderedElements.forEach(function(elem) {
          if (options.enabled !== undefined && elem.enabled !== options.enabled) return;
          if (options.elementType && elem.elementType !== options.elementType) return;
          if (options.subType && elem.subType !== options.subType) return;
          if (options.parentId && elem.parentId !== options.parentId) return;

          var elemLabel = elem.label || elem.tooltip || '';
          var matches = exact
            ? elemLabel === label
            : elemLabel.indexOf(label) !== -1;
          if (matches) results.push(elem);
        });

        return results;
      },

      findRenderedByType: function(elementType, options) {
        options = options || {};
        var results = [];

        this.renderedElements.forEach(function(elem) {
          if (elem.elementType !== elementType) return;
          if (options.enabled !== undefined && elem.enabled !== options.enabled) return;
          if (options.subType && elem.subType !== options.subType) return;
          if (options.parentId && elem.parentId !== options.parentId) return;
          results.push(elem);
        });

        return results;
      },

      findRenderedByParent: function(parentId, options) {
        options = options || {};
        var results = [];

        this.renderedElements.forEach(function(elem) {
          if (elem.parentId !== parentId) return;
          if (options.enabled !== undefined && elem.enabled !== options.enabled) return;
          if (options.elementType && elem.elementType !== options.elementType) return;
          if (options.subType && elem.subType !== options.subType) return;
          results.push(elem);
        });

        return results;
      },

      findAllRendered: function(filter) {
        filter = filter || {};
        var results = [];

        this.renderedElements.forEach(function(elem) {
          if (filter.enabled !== undefined && elem.enabled !== filter.enabled) return;
          if (filter.elementType && elem.elementType !== filter.elementType) return;
          if (filter.subType && elem.subType !== filter.subType) return;
          if (filter.parentId && elem.parentId !== filter.parentId) return;
          if (filter.label) {
            var elemLabel = elem.label || elem.tooltip || '';
            if (elemLabel.indexOf(filter.label) === -1) return;
          }
          results.push(elem);
        });

        return results;
      },

      dumpRendered: function() {
        console.log('[wxElementRegistry] Rendered Elements:', this.renderedElements.size);
        this.renderedElements.forEach(function(elem) {
          console.log('  ' + elem.id + ': ' + elem.elementType + '/' + elem.subType + ' "' + (elem.label || elem.tooltip || '') + '" at (' + elem.screenX + ',' + elem.screenY + ') ' + elem.width + 'x' + elem.height);
        });
      },

      getRenderedStats: function() {
        var stats = { total: 0, byType: {} };
        this.renderedElements.forEach(function(elem) {
          stats.total++;
          var key = elem.elementType + '/' + elem.subType;
          stats.byType[key] = (stats.byType[key] || 0) + 1;
        });
        return stats;
      }
    };
  }
})();

// Helper functions called from C++ via EM_ASM
function wxElementRegister(id, label, name, typeName, screenX, screenY, width, height, parentId, visible, enabled) {
  if (window.wxElementRegistry) {
    window.wxElementRegistry.register(id, {
      id: id,
      label: label,
      name: name,
      typeName: typeName,
      screenX: screenX,
      screenY: screenY,
      width: width,
      height: height,
      centerX: screenX + Math.floor(width / 2),
      centerY: screenY + Math.floor(height / 2),
      parentId: parentId,
      visible: visible,
      enabled: enabled,
      lastUpdated: Date.now()
    });
  }
}

function wxElementUpdate(id, label, name, typeName, screenX, screenY, width, height, parentId, visible, enabled) {
  if (window.wxElementRegistry) {
    var elem = window.wxElementRegistry.elements.get(id);
    if (elem) {
      elem.label = label;
      elem.name = name;
      elem.typeName = typeName;
      elem.screenX = screenX;
      elem.screenY = screenY;
      elem.width = width;
      elem.height = height;
      elem.centerX = screenX + Math.floor(width / 2);
      elem.centerY = screenY + Math.floor(height / 2);
      elem.parentId = parentId;
      elem.visible = visible;
      elem.enabled = enabled;
      elem.lastUpdated = Date.now();
      window.wxElementRegistry.version++;
    }
  }
}

function wxElementUnregister(id) {
  if (window.wxElementRegistry) {
    window.wxElementRegistry.unregister(id);
  }
}

// Helper functions for rendered elements (called from C++ via EM_ASM)
function wxRenderedElementRegister(id, parentId, elementType, subType, label, tooltip, screenX, screenY, width, height, enabled, index) {
  if (window.wxElementRegistry) {
    window.wxElementRegistry.registerRendered(id, {
      id: id,
      parentId: parentId,
      elementType: elementType,
      subType: subType,
      label: label,
      tooltip: tooltip,
      screenX: screenX,
      screenY: screenY,
      width: width,
      height: height,
      centerX: screenX + Math.floor(width / 2),
      centerY: screenY + Math.floor(height / 2),
      enabled: enabled,
      index: index,
      lastUpdated: Date.now()
    });
  }
}

function wxRenderedElementUpdate(id, screenX, screenY, width, height, enabled) {
  if (window.wxElementRegistry) {
    window.wxElementRegistry.updateRendered(id, {
      screenX: screenX,
      screenY: screenY,
      width: width,
      height: height,
      centerX: screenX + Math.floor(width / 2),
      centerY: screenY + Math.floor(height / 2),
      enabled: enabled
    });
  }
}

function wxRenderedElementUnregister(id) {
  if (window.wxElementRegistry) {
    window.wxElementRegistry.unregisterRendered(id);
  }
}

function wxRenderedElementUnregisterByParent(parentId) {
  if (window.wxElementRegistry) {
    window.wxElementRegistry.unregisterRenderedByParent(parentId);
  }
}

if (typeof navigator !== 'undefined') {
  var browserInfo = (function () {
    var ua = navigator.userAgent;

    var match =
      /(Opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
      /(OPR)[ \/]([\w.]+)/.exec(ua) ||
      /(Edge)[ \/]([\w.]+)/.exec(ua) ||
      /(MSIE) ([\w.]+)/.exec(ua) ||
      /(Chrome)[ \/]([\w.]+)/.exec(ua) ||
      /Version[ \/]([\w.]+) (Safari)/.exec(ua) ||
      /(Safari)[ \/]([\w.]+)/.exec(ua) ||
      /(Firefox)[ \/]([\w.]+)/.exec(ua) ||
      ua.indexOf('compatible') < 0 &&
      /(Mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
      [];

    if (match[2] === 'Safari') {
      return {
        browser: match[2],
        name: match[2],
        version: match[1]
      };
    } else {
      return {
        browser: match[1] || '',
        name: match[1] || '',
        version: match[2] || '0'
      };
    }
  })();

  var isWebkit = function () {
    return browserInfo.name === 'Chrome' || browserInfo.name === 'Safari';
  }

  var platformInfo = (function () {
    var ua = navigator.userAgent;

    var match =
      /(Windows NT) ([\w.]+)/.exec(ua) ||
      /(Mac OS X) ([\w.]+)/.exec(ua) ||
      /(CrOS) \w+ ([\w.]+)/.exec(ua) ||
      /(iPhone); .* OS ([\d_]+)/.exec(ua) ||
      /(iPad); .* OS ([\d_]+)/.exec(ua);

    var name = 'unknown';
    var version = '';

    if (match) {
      name = match[1];
      version = match[2];
    } else {
      var PLATFORMS = ['Android', 'iPhone', 'iPad', 'Windows', 'Macintosh', 'Linux', 'CrOs', 'NetBSD', 'OpenBSD', 'FreeBSD'];

      for (var i = 0; i < PLATFORMS.length; i++) {
        if (ua.indexOf(PLATFORMS[i]) !== -1) {
          name = PLATFORMS[i];
        }
      }
    }

    return {
      name: name,
      version: version
    };
  })();
}

  var openUrl = function(url) {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  var setIcon = function(id) {
    var bitmap = bitmapMap.get(id);

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    drawImage(ctx, bitmap, 0, 0);

    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'shortcut icon';
    link.href = canvas.toDataURL('image/png');
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  var displayScaleFactor = null;

  var getDisplayScaleFactor = function () {
    if (displayScaleFactor === null) {
      displayScaleFactor = window.devicePixelRatio >= 1.5 ? 2.0 : 1.0;
    }
    return displayScaleFactor;
  };

  // wx "screen" coords are #canvas-relative CSS px (the mouse-ingress and
  // element-registry contract: emscripten targetX/Y and wx-dom's forwarded
  // events are both computed against #canvas). Positioned window elements
  // live in OTHER CSS frames — absolute children of #window-container, or the
  // viewport for fixed popups — and those frames need not share #canvas's
  // origin (template.html puts #window-container BELOW the canvas, so
  // unanchored windows land a full viewport off-screen). Returns the offset
  // that maps wx screen coords into the element's frame. Measured per call:
  // both rects are viewport-relative so scroll cancels, and no cache means no
  // invalidation bugs. #canvas always exists and has live geometry by the
  // time any secondary window is placed (they are created after runtime
  // init, when the shell has flipped the canvas to display:block).
  var wxScreenBase = function (isFixed) {
    var canvasRect = document.getElementById('canvas').getBoundingClientRect();
    if (isFixed) {
      return { left: canvasRect.left, top: canvasRect.top };
    }
    var containerRect =
        document.getElementById('window-container').getBoundingClientRect();
    return { left: canvasRect.left - containerRect.left,
             top: canvasRect.top - containerRect.top };
  };

  /* wxNonOwnedWindow */

  // Ensure #window-container creates a stacking context so GL canvases
  // render above the 2D #canvas inside #main-window.
  // This runs at script eval, and with -pthread the same script also evaluates
  // inside Web Workers, where `document` doesn't exist — guard or the workers
  // die with "ReferenceError: document is not defined" before the app loads.
  var windowContainer = (typeof document !== 'undefined')
      ? document.getElementById('window-container') : null;
  if (windowContainer) {
    // The app's coordinate anchors (#main-window wrapping #canvas, and
    // #window-container holding secondary windows) must not move with page
    // flow: content above them (the template's status block) collapses when
    // the app starts, and an anchor that shifts AFTER windows were placed
    // strands those windows at stale offsets. A host that positioned the
    // elements itself (the kicad pages pin both at 0,0) is respected; an
    // unpositioned one gets the same pinned-overlay layout enforced here.
    // #window-container also creates a stacking context (z-index:1) so GL
    // canvases render above the 2D #canvas inside #main-window.
    if (document.defaultView.getComputedStyle(windowContainer).position === 'static') {
      windowContainer.style.position = 'absolute';
      windowContainer.style.left = '0';
      windowContainer.style.top = '0';
    }
    windowContainer.style.zIndex = '1';

    // wx-dom controls are absolute children of #main-window carrying
    // wx-screen (canvas-origin) coords, so #main-window must be a positioned
    // element wrapping #canvas at its top-left.
    var mainWindowEl = document.getElementById('main-window');
    if (mainWindowEl &&
        document.defaultView.getComputedStyle(mainWindowEl).position === 'static') {
      mainWindowEl.style.position = 'absolute';
      mainWindowEl.style.left = '0';
      mainWindowEl.style.top = '0';
    }

    // Window-chrome CSS for the divs createWindow() builds (.window /
    // .window.toplevel / .window-canvas). Injected here — the code that creates
    // these elements — so every host (the e2e test pages, the React standalone
    // shell, and the wx build template) gets identical styling from one source
    // instead of pasting it into each page's <style>. pcbjam #22.
    if (!document.getElementById('wx-window-chrome')) {
      var wxStyle = document.createElement('style');
      wxStyle.id = 'wx-window-chrome';
      wxStyle.textContent = [
        '.window {',
        '  position: absolute;',
        '  pointer-events: none;',
        '  z-index: 10;',
        '  background-color: black;',
        '  overflow: hidden;',
        '  width: 0;',
        '  height: 0;',
        '}',
        // Modal dialogs (top-level windows, not popup menus) get a border + drop
        // shadow so they read as raised surfaces. Popup menus style themselves
        // in wx-dom.js and the main frame is #canvas — neither matches
        // .window.toplevel, so neither is affected.
        '.window.toplevel {',
        // outline, not border: a border shifts the padding box (where
        // .window-canvas and wx-dom controls anchor) 1px off the wx model
        // rect; an outline draws outside the box with zero layout effect.
        '  outline: 1px solid #808080;',
        '  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.35);',
        '}',
        // Input barrier for surfaces shadowed by a higher, overlapping
        // top-level window (see recomputeModalBarrier). Each dialog/main-frame
        // control is a real DOM element with pointer-events:auto, so without
        // this a click over an upper window's canvas-drawn area (which is
        // pointer-events:none) still hit-tests the live control beneath it —
        // a dialog's control under a higher dialog, or a main-frame control
        // (e.g. pcbnew's track-width <select>) under a secondary frame like
        // the 3D viewer. Forcing the subtree to pointer-events:none —
        // !important to beat the inline pointer-events:auto wx-dom.js sets on
        // controls — drops the click through to #canvas, where the C++
        // hit-test routes it to the true topmost window. Native wx leans on
        // the OS to block input to shadowed windows; the browser has no such
        // barrier, so we add one here.
        '.wx-inert, .wx-inert * {',
        '  pointer-events: none !important;',
        '}',
        '.window-canvas {',
        '  position: absolute;',
        '  top: 0;',
        '  left: 0;',
        '  pointer-events: none;',
        '}',
        // Real DOM title bar for non-main wxFrames (e.g. the 3D viewer). It lives
        // in the top strip of the window-N div with pointer-events:auto, so it
        // wins hit-testing over OTHER frames' DOM controls (it sits inside
        // #window-container (z-index:1), above #main-window's controls). It never
        // overlaps the GL canvas — the GL canvas is positioned the title-bar
        // height BELOW the frame top — so the GL canvas's huge z-index is
        // irrelevant. z-index:11 keeps the bar above the sibling .window-canvas
        // inside window-N's own stacking context (window-N has z-index:10), so it
        // never escapes that context or competes with the GL sentinel z.
        '.window-titlebar {',
        '  position: absolute;',
        '  top: 0;',
        '  left: 0;',
        '  right: 0;',
        '  pointer-events: auto;',
        '  cursor: move;',
        '  z-index: 11;',
        '  display: flex;',
        '  align-items: center;',
        '  box-sizing: border-box;',
        '  background-color: #c8c8c8;',
        '  color: #282828;',
        '  font: bold 12px sans-serif;',
        '  user-select: none;',
        '}',
        '.window-titlebar-text {',
        '  flex: 1;',
        '  padding: 0 6px;',
        '  overflow: hidden;',
        '  text-overflow: ellipsis;',
        '  white-space: nowrap;',
        '}',
        '.window-titlebar-close {',
        '  pointer-events: auto;',
        '  cursor: pointer;',
        '  width: 22px;',
        '  height: 100%;',
        '  border: 0;',
        '  padding: 0;',
        '  background: transparent;',
        '  color: #282828;',
        '  font: bold 15px sans-serif;',
        '  line-height: 1;',
        '}',
        '.window-titlebar-close:hover {',
        '  background-color: #e25a5a;',
        '  color: #ffffff;',
        '}',
        // Edge-resize handles for resizable (wxRESIZE_BORDER) non-main windows.
        // pointer-events:auto + z-index:12 so they win hit-testing inside window-N's
        // own stacking context (above the .window-canvas) AND over other frames'
        // controls (#window-container z-index:1 out-stacks #main-window). Box geometry
        // (top/left/right/bottom/size) is set inline by createWindowResizeHandles so
        // the left/right edges can start below the title bar; CSS carries only the
        // shared bits + per-direction cursor. No top edge/corners: the title bar owns
        // the top strip (move + close), so handles never overlap it.
        '.window-resize-handle {',
        '  position: absolute;',
        '  pointer-events: auto;',
        '  z-index: 12;',
        '}',
        '.window-resize-e { cursor: ew-resize; }',
        '.window-resize-w { cursor: ew-resize; }',
        '.window-resize-s { cursor: ns-resize; }',
        '.window-resize-se { cursor: nwse-resize; z-index: 13; }',
        '.window-resize-sw { cursor: nesw-resize; z-index: 13; }'
      ].join('\n');
      document.head.appendChild(wxStyle);
    }
  }

  var nextWindowId = 0;
  var windowMap = new Map();

  var createWindow = function (id, needsCanvas, isVisible, classList) {
    //console.log('createWindow: ' + id + ' ' + needsCanvas + ' ' + isVisible);

    if (id === -1) {
      id = nextWindowId++;
    }
    
    var window = null;
    var canvas = null;

    if (id === 0) {
      window = document.getElementById('main-window');
      canvas = document.getElementById('canvas');
    } else {
      window = document.createElement('div');
      window.className = classList;
      window.id = 'window-' + id;
      window.style.display = isVisible ? 'block' : 'none';

      // Popup/transient windows (toolbar palettes, color pickers, etc.) are
      // floating overlays. Position them relative to the viewport instead of
      // absolutely within #window-container so they never scroll with page
      // content; setWindowRect maps their wx screen coords to the viewport
      // via wxScreenBase(true) (#canvas's viewport offset).
      if (classList && (' ' + classList + ' ').indexOf(' popup ') !== -1) {
        window.style.position = 'fixed';
      }

      if (needsCanvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'window-canvas';
        window.appendChild(canvas);
      }

      document.getElementById('window-container').appendChild(window);
    }

    windowMap.set(id, {
      window: window,
      canvas: canvas,
      width: 0,
      height: 0,
      imageData: null,
      context: null
    });

    return id;
  };

  var destroyWindow = function (id) {
    var windowData = windowMap.get(id);

    // The window element isn't always a child of #window-container (it may have
    // been moved or never appended), so removeChild() on the container throws
    // NotFoundError — which unwinds out of native callers like OpenProjectFiles
    // and aborts the operation. Use Element.remove(): detaches from whatever
    // parent it has, and is a no-op when unparented.
    if (windowData && windowData.window) windowData.window.remove();
    windowMap.delete(id);
    recomputeModalBarrier();
  };

  // Read-only accessor for the DOM port's control layer (wx-dom.js): native
  // controls attach to their top-level window's container element. No
  // behavior change for the canvas port. (Guarded: with -pthread this script
  // also evaluates in Web Workers, where `window` doesn't exist.)
  if (typeof window !== 'undefined') {
    window.__wxGetWindowElement = function (id) {
      var windowData = windowMap.get(id);
      return windowData ? windowData.window : null;
    };
  }

  var setWindowVisibility = function (id, isVisible) {
    //console.log('setWindowVisibility: ' + id + ': ' + isVisible);

    var windowData = windowMap.get(id);
    windowData.window.style.display = isVisible ? 'block' : 'none';
    recomputeModalBarrier();
  };

  var setWindowRect = function (id, x, y, width, height) {
    //console.log('setWindowRect: ' + id + ' (' + x + ', ' + y + ', ' + width + ', ' + height + ')');

    var windowData = windowMap.get(id);

    var window = windowData.window;
    if (id === 0) {
      // The main window owns #canvas — it DEFINES the wx screen origin.
      window.style.left = x + 'px';
      window.style.top = y + 'px';
    } else {
      var base = wxScreenBase(window.style.position === 'fixed');
      window.style.left = (x + base.left) + 'px';
      window.style.top = (y + base.top) + 'px';
    }
    window.style.width = width + 'px';
    window.style.height = height + 'px';

    // A moved/resized window changes which main-frame controls it shadows.
    wxScheduleBarrierRecompute();

    var canvas = windowData.canvas;

    if (canvas) {
      var scaleFactor = getDisplayScaleFactor();
      var newWidth = width * scaleFactor;
      var newHeight = height * scaleFactor;

      // Only RE-ASSIGN canvas.width/height when the pixel dimensions actually
      // change. Assigning canvas.width/height clears the canvas to transparent
      // (true in both Chrome and Firefox, even when the value is unchanged). A
      // position-only move — e.g. dragging a dialog by its title bar — keeps the
      // same size, and a move does not schedule a repaint of the window's own
      // content (DoMoveWindow only refreshes the parent). Clearing here would
      // therefore leave the canvas transparent, exposing the black `.window`
      // div behind it until some later repaint. See pcbjam #22.
      //
      // Everything below the guard must run UNCONDITIONALLY: a freshly created
      // window's canvas defaults to 300x150, so when a modal's first
      // setWindowRect happens to match that size the guard is false — and if the
      // context/imageData init lived inside the guard, windowData.context would
      // stay null and the next paint (createWindowContext) would throw
      // "Cannot read properties of null (reading 'depth')", cancelling the modal.
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
      }

      windowData.width = canvas.width;
      windowData.height = canvas.height;

      if (windowData.width > 0 && windowData.height > 0) {
        windowData.imageData = new ImageData(windowData.width, windowData.height);
      } else {
        windowData.imageData = null;
      }

      var ctx = canvas.getContext('2d');
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.imageSmoothingEnabled = false;
      ctx.textBaseline = 'alphabetic';
      ctx.depth = 0;
      ctx.stack = [];

      windowData.context = ctx;
    }

    // A move/resize changes which windows overlap, so re-derive the barrier
    // (e.g. a modal is centered via setWindowRect after it is first shown).
    recomputeModalBarrier();
  };

  // Build a real DOM title bar (drag handle + title text + close "X") for a
  // non-main wxFrame's window-N div (called from wxTopLevelWindowWasm::Create via
  // EM_ASM). Replaces the canvas-painted title bar so the bar wins DOM
  // hit-testing instead of relying on #canvas event routing — which an
  // overlapping pointer-events:auto control from another frame would steal (the
  // confirmed 3D-viewer bug). Drag funnels through wx_window_move ->
  // wxWindow::Move (one reposition source of truth: children follow via the
  // size-event -> Layout path). Close funnels through wx_window_close -> wx
  // Close() as an ASYNC ccall (Close may pump the loop / show a modal).
  // barHeight comes from the C++ TITLE_BAR_HEIGHT so the strip height is single-
  // sourced and never under/over-laps the client area reserved for it.
  var createWindowTitlebar = function (id, title, barHeight) {
    var windowData = windowMap.get(id);
    if (!windowData || !windowData.window) {
      return;
    }
    var win = windowData.window;

    var bar = document.createElement('div');
    bar.className = 'window-titlebar';
    bar.style.height = barHeight + 'px';

    var text = document.createElement('span');
    text.className = 'window-titlebar-text';
    text.textContent = title || '';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'window-titlebar-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';

    bar.appendChild(text);
    bar.appendChild(closeBtn);
    win.appendChild(bar);

    windowData.titlebar = bar;
    windowData.titlebarText = text;

    // --- Drag: titlebar pointer -> wx screen coords -> wx_window_move. --------
    var dragging = false;
    var grabDX = 0;
    var grabDY = 0;
    var pendingX = 0;
    var pendingY = 0;
    var rafPending = false;

    var flushMove = function () {
      rafPending = false;
      if (typeof Module !== 'undefined' && Module.ccall) {
        Module.ccall('wx_window_move', null,
                     ['number', 'number', 'number'], [id, pendingX, pendingY]);
      }
    };

    bar.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) {
        return;
      }
      var r = win.getBoundingClientRect();
      grabDX = ev.clientX - r.left;
      grabDY = ev.clientY - r.top;
      dragging = true;
      try { bar.setPointerCapture(ev.pointerId); } catch (e) {}
      ev.preventDefault();
      ev.stopPropagation();
    });

    bar.addEventListener('pointermove', function (ev) {
      if (!dragging) {
        return;
      }
      // Place the window's top-left so the grab point stays under the cursor,
      // in wx screen coords (#canvas-relative CSS px) — the inverse of
      // setWindowRect's wxScreenBase anchoring.
      var canvasRect = document.getElementById('canvas').getBoundingClientRect();
      pendingX = Math.round(ev.clientX - grabDX - canvasRect.left);
      pendingY = Math.round(ev.clientY - grabDY - canvasRect.top);
      ev.stopPropagation();
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(flushMove);
      }
    });

    var endDrag = function (ev) {
      if (!dragging) {
        return;
      }
      dragging = false;
      try { bar.releasePointerCapture(ev.pointerId); } catch (e) {}
      ev.stopPropagation();
    };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);

    // --- Close: X -> wx_window_close (ASYNC: Close may open a modal). ---------
    closeBtn.addEventListener('pointerdown', function (ev) {
      ev.stopPropagation(); // a press on the X must not start a window drag
    });
    closeBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (typeof Module !== 'undefined' && Module.ccall) {
        Module.ccall('wx_window_close', null, ['number'], [id], { async: true });
      }
    });
  };

  // Edge-resize handles for a resizable (wxRESIZE_BORDER) non-main window. Mirrors
  // createWindowTitlebar's pointer/rAF plumbing but drives wx_window_resize
  // (-> wxWindow::SetSize) with a FULL rect: the left/bottom edges and corners move
  // the window origin as well as its size. Five handles — right (e), left (w),
  // bottom (s) and the two bottom corners (se, sw). The top strip is the title bar
  // (move + close), so there are deliberately no top handles. barHeight comes from
  // the C++ TITLE_BAR_HEIGHT so the side handles start just below the bar.
  var createWindowResizeHandles = function (id, barHeight) {
    var windowData = windowMap.get(id);
    if (!windowData || !windowData.window) {
      return;
    }
    var win = windowData.window;

    var MIN_W = 120;    // minimum window size, px (flat floor)
    var MIN_H = 80;
    var EDGE = 6;       // edge-handle thickness, px
    var CORNER = 12;    // corner-handle size, px

    // Each handle: which window borders it moves (edges) + its inline box. e/w start
    // at barHeight so they never overlap the title bar; s/corners sit at the bottom.
    var defs = [
      { cls: 'window-resize-e', edges: { right: true },
        box: { top: barHeight + 'px', right: '0px', bottom: '0px', width: EDGE + 'px' } },
      { cls: 'window-resize-w', edges: { left: true },
        box: { top: barHeight + 'px', left: '0px', bottom: '0px', width: EDGE + 'px' } },
      { cls: 'window-resize-s', edges: { bottom: true },
        box: { left: CORNER + 'px', right: CORNER + 'px', bottom: '0px', height: EDGE + 'px' } },
      { cls: 'window-resize-se', edges: { right: true, bottom: true },
        box: { right: '0px', bottom: '0px', width: CORNER + 'px', height: CORNER + 'px' } },
      { cls: 'window-resize-sw', edges: { left: true, bottom: true },
        box: { left: '0px', bottom: '0px', width: CORNER + 'px', height: CORNER + 'px' } }
    ];

    var handles = [];
    var resizing = false;
    var activeEdges = null;
    var startRect = null;       // window rect (viewport coords) captured at grab
    var startX = 0, startY = 0; // pointerdown coords
    var pending = null;         // {x, y, w, h} in wx screen coords
    var rafPending = false;

    var flushResize = function () {
      rafPending = false;
      if (pending && typeof Module !== 'undefined' && Module.ccall) {
        Module.ccall('wx_window_resize', null,
                     ['number', 'number', 'number', 'number', 'number'],
                     [id, pending.x, pending.y, pending.w, pending.h]);
      }
    };

    defs.forEach(function (def) {
      var handle = document.createElement('div');
      handle.className = 'window-resize-handle ' + def.cls;
      for (var k in def.box) {
        if (def.box.hasOwnProperty(k)) {
          handle.style[k] = def.box[k];
        }
      }
      win.appendChild(handle);
      handles.push(handle);

      handle.addEventListener('pointerdown', function (ev) {
        if (ev.button !== 0) {
          return;
        }
        resizing = true;
        activeEdges = def.edges;
        startRect = win.getBoundingClientRect();
        startX = ev.clientX;
        startY = ev.clientY;
        try { handle.setPointerCapture(ev.pointerId); } catch (e) {}
        ev.preventDefault();
        ev.stopPropagation();
      });

      handle.addEventListener('pointermove', function (ev) {
        if (!resizing) {
          return;
        }
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;

        // New viewport rect: move only the active borders (top never moves here).
        var left = startRect.left;
        var top = startRect.top;
        var right = startRect.right;
        var bottom = startRect.bottom;
        if (activeEdges.left) { left = startRect.left + dx; }
        if (activeEdges.right) { right = startRect.right + dx; }
        if (activeEdges.bottom) { bottom = startRect.bottom + dy; }

        var w = right - left;
        var h = bottom - top;
        // Clamp to the minimum, anchored to the FIXED edge so the window doesn't jump.
        if (w < MIN_W) {
          if (activeEdges.left) { left = right - MIN_W; }
          w = MIN_W;
        }
        if (h < MIN_H) {
          bottom = top + MIN_H; // top is anchored; only the bottom moved
          h = MIN_H;
        }

        // Convert the top-left back to wx screen coords (#canvas-relative CSS
        // px) — the inverse of setWindowRect's wxScreenBase anchoring, the
        // same transform the title-bar drag uses.
        var canvasRect = document.getElementById('canvas').getBoundingClientRect();
        pending = {
          x: Math.round(left - canvasRect.left),
          y: Math.round(top - canvasRect.top),
          w: Math.round(w),
          h: Math.round(h)
        };
        ev.stopPropagation();
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(flushResize);
        }
      });

      var endResize = function (ev) {
        if (!resizing) {
          return;
        }
        resizing = false;
        try { handle.releasePointerCapture(ev.pointerId); } catch (e) {}
        ev.stopPropagation();
      };
      handle.addEventListener('pointerup', endResize);
      handle.addEventListener('pointercancel', endResize);
    });

    windowData.resizeHandles = handles;
  };

  // Update an existing DOM title bar's text (no-op if the bar isn't built yet —
  // the Create-time SetTitle runs before createWindowTitlebar).
  var setWindowTitle = function (id, title) {
    var windowData = windowMap.get(id);
    if (windowData && windowData.titlebarText) {
      windowData.titlebarText.textContent = title || '';
    }
  };

  var setWindowZIndex = function (id, zIndex) {
    //console.log('setWindowZIndex: ' + id + ': ' + zIndex);

    // The main window (id=0) lives outside #window-container at the body level.
    // Setting its z-index would place it above #window-container's stacking context,
    // hiding GL canvases and popup windows inside it.
    if (id === 0) return;

    var windowData = windowMap.get(id);
    windowData.window.style.zIndex = zIndex;
  };

  var raiseWindow = function (id) {
    var maxZ = 0;

    // Check z-index of all windows
    for (const windowId of windowMap.keys()) {
      var windowData = windowMap.get(windowId);
      if (windowId !== id && windowData) {
        var style = document.defaultView.getComputedStyle(windowData.window);
        var zIndex = parseInt(style.getPropertyValue('z-index'), 10);
        if (!isNaN(zIndex)) {
          maxZ = Math.max(maxZ, zIndex);
        }
      }
    }

    // Also check z-index of GL canvases so popups can appear above them
    for (const [glId, canvas] of glCanvasMap.entries()) {
      if (canvas && canvas.style.display !== 'none') {
        var style = document.defaultView.getComputedStyle(canvas);
        var zIndex = parseInt(style.getPropertyValue('z-index'), 10);
        if (!isNaN(zIndex)) {
          maxZ = Math.max(maxZ, zIndex);
        }
      }
    }

    setWindowZIndex(id, maxZ + 1);
    recomputeModalBarrier();
  };

  var lowerWindow = function (id) {
    var minZ = 0;

    for (const windowId of windowMap.keys()) {
      var windowData = windowMap.get(windowId);
      if (windowId !== id && windowData) {
        var style = document.defaultView.getComputedStyle(windowData.window);
        var zIndex = parseInt(style.getPropertyValue('z-index'), 10);
        if (!isNaN(zIndex)) {
          minZ = Math.min(minZ, zIndex);
        }
      }
    }

    setWindowZIndex(id, minZ - 1);
    recomputeModalBarrier();
  };

  var rectsOverlap = function (a, b) {
    return a.left < b.right && a.right > b.left &&
           a.top < b.bottom && a.bottom > b.top;
  };

  // Re-derive the shadowed-window input barrier from the current z-order and
  // geometry. A top-level dialog/frame is "shadowed" — and gets the wx-inert
  // class so its DOM controls stop receiving pointer events — when some other
  // top-level window with a higher z-index overlaps it. This is what makes a
  // click land on the genuine topmost window (via #canvas + the C++ hit-test)
  // instead of leaking to a live control of a dialog stacked underneath it.
  //
  // Excluded from the barrier, by design:
  //   - the main window (id 0): its #canvas must stay live so shadowed windows'
  //     clicks can fall through to the C++ hit-test.
  //   - popups/tooltips (.popup): they must stay interactive (e.g. a combobox
  //     dropdown) and must never shadow the dialog beneath them, so they count
  //     neither as inert candidates nor as shadowing windows.
  // Non-overlapping windows (e.g. two side-by-side modeless dialogs) are left
  // interactive — only a genuine overlap blocks input.
  var recomputeModalBarrier = function () {
    if (typeof document === 'undefined') return; // worker context: no DOM
    var wins = [];
    windowMap.forEach(function (windowData, id) {
      if (id === 0 || !windowData) return;
      var el = windowData.window;
      if (!el || !el.classList ||
          !el.classList.contains('toplevel') || el.classList.contains('popup')) {
        return;
      }
      if (el.style.display === 'none') return;
      var z = parseInt(document.defaultView.getComputedStyle(el).zIndex, 10);
      if (isNaN(z)) z = 0;
      wins.push({ el: el, z: z, rect: el.getBoundingClientRect() });
    });

    wins.forEach(function (w) {
      var shadowed = wins.some(function (o) {
        return o !== w && o.z > w.z && rectsOverlap(o.rect, w.rect);
      });
      w.el.classList.toggle('wx-inert', shadowed);
      // Also block focus/keyboard on the shadowed window where supported; the
      // pointer-events CSS above is what actually re-routes the clicks.
      try { w.el.inert = shadowed; } catch (e) { /* older engine: CSS suffices */ }
    });

    // The main window (id 0) is excluded from `wins` — its #canvas must stay
    // live — but its wx-dom controls sit ABOVE #canvas with
    // pointer-events:auto, so a click meant to fall through an overlapping
    // secondary window's pointer-events:none surface lands on a control of
    // the frame BENEATH it instead (the 3D viewer's toolbar row over pcbnew's
    // track-width <select> popped that select's native dropdown). Secondary
    // windows always paint above #main-window (#window-container is
    // z-index:1), so a main-frame control that any visible one overlaps must
    // not take input. Per-control granularity: controls outside the overlap
    // (e.g. the layers panel beside a small viewer) stay interactive.
    var mainData = windowMap.get(0);
    if (mainData && mainData.window) {
      mainData.window.querySelectorAll(
          '.wx-dom-control, .wx-tab-strip, [data-wx-menu-bar="1"]')
        .forEach(function (c) {
          var covered = false;
          if (wins.length) {
            var cr = c.getBoundingClientRect();
            if (cr.width > 0 && cr.height > 0) {
              covered = wins.some(function (w) { return rectsOverlap(w.rect, cr); });
            }
          }
          c.classList.toggle('wx-inert', covered);
          try { c.inert = covered; } catch (e) { /* older engine: CSS suffices */ }
        });
    }
  };

  // Window rects change per animation frame during a titlebar drag or edge
  // resize, and wx-dom controls move during main-frame relayout — coalesce
  // the barrier recomputes those trigger instead of running one per call.
  var barrierRecomputePending = false;
  var wxScheduleBarrierRecompute = function () {
    if (typeof document === 'undefined' || barrierRecomputePending) return;
    barrierRecomputePending = true;
    requestAnimationFrame(function () {
      barrierRecomputePending = false;
      recomputeModalBarrier();
    });
  };

  /* wxColour */

  var formatHexString = function (n) {
    var hexString = n.toString(16);
    while (hexString.length < 8) {
      hexString = '0' + hexString;
    }
    return hexString;
  };

  var makeColorString = function (color) {
    var a = (color >> 24) & 0xff;
    var b = (color >> 16) & 0xff;
    var g = (color >> 8) & 0xff;
    var r = color & 0xff;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a / 255.0 + ')';
    //return '#' + formatHexString(color);
  };

  /* wxBitmap */

  var nextBitmapId = 0;
  var bitmapMap = new Map();

  var createBitmap = function (x, y, width, height, data, scaleFactor) {
    //console.log('setWindowImageData: ' + id + ': ' + '(' + x + ', ' + y + ') ' + width + 'x' + height);

    var id = nextBitmapId++;    
    setBitmapData(id, x, y, width, height, data, scaleFactor);

    return id;
  };

  var destroyBitmap = function (id) {
    bitmapMap.delete(id);
  };

  var getBitmapData = function (id, data) {
    var bitmap = bitmapMap.get(id);

    if (!bitmap) {
      return;
    }

    var imageData;

    if (bitmap.context) {
      imageData = bitmap.context.getImageData(0, 0, bitmap.width, bitmap.height);
      bitmap.context = null;
    } else {
      imageData = bitmap.imageData;
    }

    if (!imageData) {
      return;
    }

    // Cache the recovered pixels so a later SyncToCpp on this bitmap (after its
    // memory-DC context has been consumed) can't dereference a null imageData.
    bitmap.imageData = imageData;
    bitmap.imageBitmap = null;

    Module.HEAPU8.set(imageData.data, data);
  };

  var setBitmapData = function (id, width, height, data, scaleFactor) {
    var size = 4 * width * height;
    var array = new Uint8ClampedArray(Module.HEAPU8.buffer, data, size);
    var imageData = new ImageData(width, height);  
    imageData.data.set(array);

    var bitmap = {
      data: data,
      size: size,
      width: width,
      height: height,
      scaleFactor: scaleFactor,
      imageData: imageData,
      imageBitmap: null,
      context: null
    };

    bitmapMap.set(id, bitmap);

    createImageBitmap(imageData, 0, 0, width, height).then(function (imageBitmap) {
      // TODO: fix race condition
      var bitmap = bitmapMap.get(id);
      if (bitmap && !bitmap.context) {
        bitmap.imageBitmap = imageBitmap;
      }
    })
  };

  /* wxDC */

  var nextContextId = 0;
  var contextMap = new Map();

  var createOffscreenContext = function (width, height) {
    var canvas = null;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
    } else if (typeof document !== 'undefined' && 'createElement' in document) {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
    }

    if (canvas !== null) {
        var ctx = canvas.getContext('2d');
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.imageSmoothingEnabled = false;
        ctx.textBaseline = 'alphabetic';
        return ctx;
    } else {
        return null;
    }
  };

  var offscreenContext = createOffscreenContext(1, 1);

  var pushContext = function (ctx) {
    var saveCtx = {
      x: ctx.x,
      y: ctx.y,
      width: ctx.width,
      height: ctx.height,
      scaleFactor: ctx.scaleFactor,
      isInitialized: ctx.isInitialized
    };

    if (ctx.isInitialized) {
      saveCtx.font = ctx.font,
      saveCtx.lineWidth = ctx.lineWidth,
      saveCtx.lineJoin = ctx.lineJoin,
      saveCtx.lineCap = ctx.lineCap,
      saveCtx.fillStyle = ctx.fillStyle,
      saveCtx.strokeStyle = ctx.strokeStyle
      saveCtx.dashCount = ctx.dashCount;

      if (saveCtx.dashCount > 0) {
        saveCtx.setLineDash(ctx.getLineDash());
      }

      ctx.restore();
      ctx.save();
    }

    ctx.stack.push(saveCtx);
  };

  var popContext = function (ctx) {
    var restoreCtx = ctx.stack.pop();

    ctx.x = restoreCtx.x;
    ctx.y = restoreCtx.y;
    ctx.width = restoreCtx.width;
    ctx.height = restoreCtx.height;
    ctx.scaleFactor = restoreCtx.scaleFactor;
    ctx.isInitialized = restoreCtx.isInitialized;

    if (ctx.isInitialized) {
      ctx.restore();
      ctx.save();

      ctx.font = restoreCtx.font;
      ctx.lineWidth = restoreCtx.lineWidth;
      ctx.lineJoin = restoreCtx.lineJoin;
      ctx.lineCap = restoreCtx.lineCap;
      ctx.fillStyle = restoreCtx.fillStyle;
      ctx.strokeStyle = restoreCtx.strokeStyle;
      ctx.dashCount = restoreCtx.dashCount;

      if (ctx.dashCount > 0) {
        ctx.setLineDash(restoreCtx.getLineDash());
      }

      // TODO: save/restore clip
      ctx.beginPath();
      ctx.rect(0, 0, ctx.width, ctx.height);
      ctx.clip();
    }
  };

  // GL canvas element management (for wxGLCanvas child windows)
  var glCanvasMap = new Map();
  var nextGLCanvasId = 1;

  var createGLCanvas = function (isVisible) {
    var id = nextGLCanvasId++;
    var canvas = document.createElement('canvas');
    canvas.id = 'glcanvas-' + id;
    canvas.className = 'gl-canvas';
    canvas.style.position = 'absolute';
    canvas.style.display = 'none';  // Always start hidden until properly positioned
    // A GL canvas created while another is already on screen belongs to a SECONDARY
    // top-level window (e.g. the 3D viewer). The shared 2D #canvas is painted above
    // the GL canvases and is only kept transparent over the MAIN window's canvas
    // region, so a secondary GL canvas is otherwise hidden behind #canvas's window
    // fill. Lift it above #canvas. (Pop-up menus are DOM and stack above regardless;
    // only a modal dialog drawn on #canvas over this canvas would be occluded — rare
    // for the 3D viewer.)
    var hasVisibleGL = false;
    glCanvasMap.forEach(function (c) { if (c.style.display !== 'none') hasVisibleGL = true; });
    canvas.style.zIndex = hasVisibleGL ? '2147483647' : '100';
    canvas.style.pointerEvents = 'none';  // Don't intercept clicks - let main canvas handle events
    document.getElementById('window-container').appendChild(canvas);
    glCanvasMap.set(id, canvas);
    return id;
  };

  var setGLCanvasRect = function (id, x, y, width, height) {
    var canvas = glCanvasMap.get(id);
    if (!canvas) return;

    // Only position and show if we have valid dimensions
    if (width <= 0 || height <= 0) {
      canvas.style.display = 'none';
      return;
    }

    // GL canvases are absolute children of #window-container — anchor them
    // the same way setWindowRect anchors window divs, so they stay glued to
    // their frame in hosts where the container is not at the canvas origin.
    var base = wxScreenBase(false);
    canvas.style.left = (x + base.left) + 'px';
    canvas.style.top = (y + base.top) + 'px';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    var scaleFactor = getDisplayScaleFactor();
    var newW = width * scaleFactor;
    var newH = height * scaleFactor;
    // Only reassign the backing store when the pixel size actually changes:
    // assigning canvas.width/height clears the GL drawing buffer, which would
    // blank/flicker the 3D view on every pointermove during a title-bar drag (a
    // drag is a pure move — same size). Mirrors the guard in setWindowRect.
    if (canvas.width !== newW || canvas.height !== newH) {
      canvas.width = newW;
      canvas.height = newH;
    }

    // Show the canvas now that it's properly positioned
    // (visibility is also controlled by setGLCanvasVisibility for show/hide logic)
    if (canvas.dataset.shouldBeVisible !== 'false') {
      canvas.style.display = 'block';
    }
  };

  var setGLCanvasVisibility = function (id, isVisible) {
    var canvas = glCanvasMap.get(id);
    if (canvas) {
      canvas.dataset.shouldBeVisible = isVisible ? 'true' : 'false';
      canvas.style.display = isVisible ? 'block' : 'none';
    }
  };

  var destroyGLCanvas = function (id) {
    var canvas = glCanvasMap.get(id);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    glCanvasMap.delete(id);
  };

  // Patch Emscripten's GL.newRenderingFrameStarted to handle contexts without temp buffers
  // This is needed because wxGLCanvas creates additional WebGL contexts that don't have
  // the temp buffers initialized (those are only set up during GLImmediate.init for the main context)
  var patchGLNewRenderingFrameStarted = function () {
    if (typeof GL === 'undefined' || !GL.newRenderingFrameStarted) {
      return; // GL not initialized yet
    }
    if (GL._wxPatched) {
      return; // Already patched
    }
    var originalNewRenderingFrameStarted = GL.newRenderingFrameStarted;
    GL.newRenderingFrameStarted = function () {
      if (!GL.currentContext) {
        return;
      }
      // Skip temp buffer operations if they haven't been initialized for this context
      if (!GL.currentContext.tempVertexBuffers1 || !GL.currentContext.tempVertexBufferCounters1) {
        return;
      }
      return originalNewRenderingFrameStarted.call(this);
    };
    GL._wxPatched = true;
  };

  // Try to patch GL immediately and also set up a delayed check
  // (GL object is created after wx.js runs)
  if (typeof GL !== 'undefined') {
    patchGLNewRenderingFrameStarted();
  }
  // Check periodically until patched (GL is created during Module initialization)
  var glPatchInterval = setInterval(function () {
    if (typeof GL !== 'undefined') {
      patchGLNewRenderingFrameStarted();
      if (GL._wxPatched) {
        clearInterval(glPatchInterval);
      }
    }
  }, 10);
  // Clear interval after 5 seconds to avoid memory leak if GL never gets created
  setTimeout(function () {
    clearInterval(glPatchInterval);
  }, 5000);

  var createWindowContext = function (windowId, x, y, width, height, scaleFactor) {
    var id = nextContextId++;
    //console.log('createWindowContext: ' + windowId + ' ' + x + ' ' + y + ' ' + width + ' ' + height);

    var windowData = windowMap.get(windowId);
    var ctx = windowData.context;

    if (ctx.depth > 0) {
      pushContext(ctx);
    }

    ctx.x = x;
    ctx.y = y;
    ctx.width = width;
    ctx.height = height;
    ctx.scaleFactor = scaleFactor;
    ctx.isInitialized = false;
    ctx.depth++;

    contextMap.set(id, ctx);

    return id;
  };

  var destroyWindowContext = function (id) {
    var ctx = contextMap.get(id);

    if (ctx.isInitialized) {
      ctx.restore();
    }

    if (ctx.depth > 1) {
      popContext(ctx);
    }

    ctx.depth--;

    //console.log('destroyContext: ' + id + ' ' + ctx.width + ' ' + ctx.height);
    contextMap.delete(id);
  };

  var createMemoryContext = function (bitmapId, scaleFactor) {
    var contextId = nextContextId++;
    var bitmap = bitmapMap.get(bitmapId);

    var ctx = createOffscreenContext(bitmap.width, bitmap.height);

    ctx.x = 0;
    ctx.y = 0;
    ctx.width = bitmap.width / scaleFactor;
    ctx.height = bitmap.height / scaleFactor;
    ctx.scaleFactor = scaleFactor;
    ctx.dashCount = 0;
    ctx.isInitialized = true;
    ctx.depth = 0;
    ctx.stack = [];

    ctx.scale(scaleFactor, scaleFactor);

    contextMap.set(contextId, ctx);

    drawImage(ctx, bitmap, 0, 0);

    bitmap.imageData = null;
    bitmap.imageBitmap = null;
    bitmap.context = ctx;

    return contextId;
  };

  var destroyMemoryContext = function (contextId) {
    //console.log('deselectBitmap: ' + contextId);
    contextMap.delete(contextId);
  };

  var getContext = function (id) {
    var ctx = contextMap.get(id);

    if (!ctx.isInitialized) {
      // scale and translate(x, y)
      var x = ctx.x;
      var y = ctx.y;
      var scaleFactor = ctx.scaleFactor;

      ctx.setTransform(scaleFactor, 0, 0, scaleFactor, scaleFactor * x, scaleFactor * y);

      ctx.save();

      ctx.beginPath();
      ctx.rect(0, 0, ctx.width, ctx.height);
      ctx.clip()

      ctx.dashCount = 0;
      ctx.isInitialized = true;
    }

    return ctx;
  };

  var setFont = function (id, font) {
    var ctx = getContext(id);
    ctx.font = font;
  };

  var createPattern = function (contextId, bitmapId) {
    var ctx = getContext(contextId);
    var bitmap = bitmapMap.get(bitmapId);
    var source;

    if (bitmap.imageBitmap) {
      source = bitmap.imageBitmap;
    } else if (bitmap.context) {
      source = bitmap.context.canvas;
    } else {
      offscreenContext.canvas.width = bitmap.width;
      offscreenContext.canvas.height = bitmap.height;
      offscreenContext.putImageData(bitmap.imageData, 0, 0);
      source = offscreenContext.canvas;
    }

    return ctx.createPattern(source, 'repeat');
  };

  var setBrush = function (contextId, color, bitmapId) {
    var ctx = getContext(contextId);

    if (bitmapId === -1 || typeof bitmapId === 'undefined') {
      ctx.fillStyle = makeColorString(color);
    } else {
      ctx.fillStyle = createPattern(contextId, bitmapId);
    }
  };

  var lineJoinMap = [
    'round',
    'bevel',
    'miter'
  ];

  var lineCapMap = [
    'butt',
    'round',
    'square'
  ];

  var setPen = function (contextId, color, lineWidth, lineJoin, lineCap, dashCount, dashPtr, bitmapId) {
    var ctx = getContext(contextId);

    ctx.lineWidth = lineWidth;
    ctx.lineJoin = lineJoinMap[lineJoin];
    ctx.lineCap = lineCapMap[lineCap];

    if (bitmapId === -1 || typeof bitmapId === 'undefined') {
      ctx.strokeStyle = makeColorString(color);
    } else {
      ctx.strokeStyle = createPattern(contextId, bitmapId);
    }

    ctx.dashCount = dashCount;
    var dashes = [];
    for (var i = 0; i < dashCount; i++) {
      dashes.push(Module.HEAP8[dashPtr + i]);
    }
    ctx.setLineDash(dashes);
  };

  var resetClip = function (ctx) {
    var font = ctx.font;
    var lineWidth = ctx.lineWidth;
    var lineJoin = ctx.lineJoin;
    var lineCap = ctx.lineCap;
    var fillStyle = ctx.fillStyle;
    var strokeStyle = ctx.strokeStyle;

    ctx.restore();
    ctx.save();

    ctx.font = font;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = lineJoin;
    ctx.lineCap = lineCap;
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
  };

  var clipRect = function (id, x, y, width, height) {
    //console.log('clipRect: ' + x + ' ' + y + ' ' + width + ' ' + height);
    var ctx = getContext(id);

    // An empty clip box means "everything is clipped out" — apply it as such.
    // (An earlier fallback expanded empty rects to the full context, but that
    // was masking the C++ side sending empty boxes for every clip.)
    if (width < 0) width = 0;
    if (height < 0) height = 0;

    resetClip(ctx);

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  };

  // Clip to a non-rectangular region composed of multiple rectangles
  var clipRegion = function (id, rectDataPtr, rectCount) {
    var ctx = getContext(id);
    resetClip(ctx);

    ctx.beginPath();

    // Read rectangle data from WASM memory (4 ints per rect: x, y, w, h)
    for (var i = 0; i < rectCount; i++) {
      var offset = rectDataPtr / 4 + i * 4;  // Convert byte offset to int offset
      var x = Module.HEAP32[offset];
      var y = Module.HEAP32[offset + 1];
      var w = Module.HEAP32[offset + 2];
      var h = Module.HEAP32[offset + 3];
      ctx.rect(x, y, w, h);
    }

    ctx.clip();
  };

  var destroyClip = function (id) {
    var ctx = getContext(id);

    resetClip(ctx);

    ctx.beginPath();
    ctx.rect(0, 0, ctx.width, ctx.height);
    ctx.clip();
  };

  var clearRect = function (id, width, height, color) {
    var ctx = getContext(id);

    var saveFillStyle = ctx.fillStyle;
    ctx.fillStyle = makeColorString(color);
    // TODO: save/restore clip

    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = saveFillStyle;
  };

  var drawRect = function (id, x, y, width, height, fill, stroke) {
    var ctx = getContext(id);

    if (fill) {
      ctx.fillRect(x, y, width, height);
    }

    if (stroke) {
      ctx.strokeRect(x, y, width, height);
    }
  };

  var drawRoundedRect = function (id, x, y, width, height, radius, fill, stroke) {
    var ctx = getContext(id);

    if (width < 0) { width = -width; x -= width; }
    if (height < 0) { height = -height; y -= height; }
    // arcTo throws IndexSizeError on a negative radius; also keep the corner
    // arcs from overlapping when the radius exceeds half a side
    radius = Math.max(0, Math.min(radius, width / 2, height / 2));

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();

    if (fill) {
      ctx.fill();
    }

    if (stroke) {
      ctx.stroke();
    }
  };

  var drawEllipse = function (id, x, y, width, height, fill, stroke) {
    var ctx = getContext(id);

    var radiusX = width / 2.0; 
    var radiusY = height / 2.0;
    var cx = x + radiusX;
    var cy = y + radiusY 

    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0.0, 0.0, 2 * Math.PI);

    if (fill) {
      ctx.fill();
    }

    if (stroke) {
      ctx.stroke();
    }
  };

  var drawArc = function (id, x, y, radius, startAngle, endAngle, fill, stroke) {
    var ctx = getContext(id);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, startAngle, endAngle, true);

    if (fill) {
      ctx.fill();
    }

    if (stroke) {
      ctx.stroke();
    }
  };

  var drawEllipticArc = function (id, x, y, width, height, startDegrees, endDegrees, fill, stroke) {
    var ctx = getContext(id);

    var radiusX = width / 2.0;
    var radiusY = height / 2.0;
    var cx = x + radiusX;
    var cy = y + radiusY;
    var startRadians = -startDegrees * (Math.PI / 180.0);
    var endRadians = -endDegrees * (Math.PI / 180.0);

    if (fill) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, 0.0, startRadians, endRadians, true);
      ctx.lineTo(cx, cy);
      ctx.fill();
    }

    if (stroke) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, 0.0, startRadians, endRadians, true);
      ctx.stroke();
    }
  };

  var drawPoint = function (id, x, y) {
    var ctx = getContext(id);
    ctx.strokeRect(x, y, 1e-6, 1e-6);
  };

  var drawLine = function (id, x1, y1, x2, y2) {
    var ctx = getContext(id);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    ctx.stroke();
  };

  var drawLines = function (id, n, ptr) {
    var ctx = getContext(id);

    if (n > 0) {
      var index = ptr >> 2;
      var x = Module.HEAP32[index++];
      var y = Module.HEAP32[index++];

      ctx.beginPath();
      ctx.moveTo(x, y);

      for (var i = 1; i < n; i++) {
        x = Module.HEAP32[index++]; 
        y = Module.HEAP32[index++];
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    } 
  };

  var drawPolygon = function (id, n, ptr, fillEvenOdd, fill, stroke) {
    var ctx = getContext(id);

    if (n > 0) {
      var index = ptr >> 2;
      var x = Module.HEAP32[index++];
      var y = Module.HEAP32[index++];

      ctx.beginPath();
      ctx.moveTo(x, y);

      for (var i = 1; i < n; i++) {
        x = Module.HEAP32[index++]; 
        y = Module.HEAP32[index++];
        ctx.lineTo(x, y);
      }

      ctx.closePath();

      if (fill) {
        ctx.fill(fillEvenOdd ? 'evenodd' : 'nonzero');
      }

      if (stroke) {
        ctx.stroke();
      }
    } 
  };

  var drawImage = function (ctx, bitmap, x, y) {
    var w = bitmap.width;
    var h = bitmap.height;
    var sf = bitmap.scaleFactor;
    var source;

    // console.log('drawImage: ' + bitmap.id + ' ' + x + ' ' + y + ' ' + w + ' ' + h + ' ' + sf);

    if (bitmap.imageBitmap) {
      source = bitmap.imageBitmap;
    } else if (bitmap.context) {
      source = bitmap.context.canvas;
    } else {
      offscreenContext.canvas.width = bitmap.width;
      offscreenContext.canvas.height = bitmap.height;
      offscreenContext.putImageData(bitmap.imageData, 0, 0);
      source = offscreenContext.canvas;
    }

    if (bitmap.scaleFactor == 1.0) {
      ctx.drawImage(source, x, y);
    } else {
      var sf = 1.0 / bitmap.scaleFactor;
      ctx.drawImage(source, 0, 0, w, h, x, y, w * sf, h * sf);
    }
  };

  var drawBitmap = function (contextId, bitmapId, x, y) {
    var ctx = getContext(contextId);
    var bitmap = bitmapMap.get(bitmapId);

    //console.log('drawBitmap: ' + contextId + ' ' + bitmapId + ' (' + x + ', ' + y + ')' + ' (' + bitmap.width + ', ' + bitmap.height + ')');

    drawImage(ctx, bitmap, x, y);
  };

  var blit = function (srcId, dstId, sx, sy, width, height, dx, dy) {
    var srcCtx = getContext(srcId);
    var dstCtx = getContext(dstId);

    //console.log('blit: ' + sx + ' ' + sy + ' ' + dx + ' ' + dy + ' ' + width + ' ' + height + ' ' + srcCtx.scaleFactor + ' ' + dstCtx.scaleFactor);

    var sf = srcCtx.scaleFactor
    dstCtx.drawImage(srcCtx.canvas, sx * sf, sy * sf, width * sf, height * sf, dx, dy, width, height);
  };

  var drawText = function (id, text, x, y, textColor, underline, strikethrough) {
    var ctx = getContext(id);
    //console.log('drawText: ' + text + ' ' + id + ' ' + ctx.width + ' ' + ctx.height);

    var fillStyle = ctx.fillStyle;

    ctx.fillStyle = makeColorString(textColor);
    ctx.fillText(text, x, y);

    // Draw text decorations (underline and/or strikethrough)
    if (underline || strikethrough) {
      var metrics = ctx.measureText(text);
      var textWidth = metrics.width;

      // Save current state
      var strokeStyle = ctx.strokeStyle;
      var lineWidth = ctx.lineWidth;

      ctx.strokeStyle = makeColorString(textColor);
      ctx.lineWidth = 1;

      if (underline) {
        // Draw underline below the baseline
        // Use fontBoundingBoxDescent if available, otherwise estimate
        var descent = metrics.fontBoundingBoxDescent || 3;
        var underlineY = y + descent;
        ctx.beginPath();
        ctx.moveTo(x, underlineY);
        ctx.lineTo(x + textWidth, underlineY);
        ctx.stroke();
      }

      if (strikethrough) {
        // Draw strikethrough at middle of text
        // Use fontBoundingBoxAscent if available, otherwise estimate
        var ascent = metrics.fontBoundingBoxAscent || 10;
        var strikeY = y - ascent * 0.35;  // ~35% up from baseline
        ctx.beginPath();
        ctx.moveTo(x, strikeY);
        ctx.lineTo(x + textWidth, strikeY);
        ctx.stroke();
      }

      // Restore state
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
    }

    ctx.fillStyle = fillStyle;
  };

  var measureText = function (text, font) {
    offscreenContext.font = font;

    var textMetrics = offscreenContext.measureText(text);
    return Math.round(textMetrics.width);
  };

  var rotateAtPoint = function (id, x, y, angle) {
    var ctx = getContext(id);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle * (Math.PI / 180.0));
  };

  var clearRotation = function (id) {
    var ctx = getContext(id);
    ctx.restore();
  };

  /* wxCursor */

  var cursorMap = [
    'default',
    'crosshair',
    'hand',
    'text',
    'wait',
    'help',
    'e-resize',
    'n-resize',
    'ne-resize',
    'nw-resize',
    's-resize',
    'se-resize',
    'sw-resize',
    'w-resize',
    'ns-resize',
    'ew-resize',
    'nesw-resize',
    'nwse-resize',
    'col-resize',
    'row-resize',
    'move',
    'vertical-text',
    'cell',
    'context-menu',
    'alias',
    'progress',
    'no-drop',
    'copy',
    'none',
    'not-allowed',
    'zoom-in',
    'zoom-out',
    'grab',
    'grabbing'
  ];

  var setCursor = function (cursorIndex, bitmapId, hotSpotX, hotSpotY) {
    if (cursorIndex >= 0 && cursorIndex < cursorMap.length) {
      var cursor = cursorMap[cursorIndex];
      if (cursor.startsWith('grab') && isWebkit()) {
        cursor = '-webkit-' + cursor;
      }
      Module.canvas.style.cursor = cursor;
    } else {
      var bitmap = bitmapMap.get(bitmapId);

      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      drawImage(ctx, bitmap, 0, 0);
      var dataUrl = 'url(' + canvas.toDataURL('image/png') + ')';

      Module.canvas.style.cursor = dataUrl + ' ' + hotSpotX + ' ' + hotSpotY + ', auto';
    }
  };

  var showFullscreen = function (enable) {
    if (enable) {
      if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
      } else if (document.body.webkitRequestFullscreen()) {
        document.body.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  var showFileDialog = function (multiple) {
    var input = document.createElement('input');
    if (multiple) {
      input.setAttribute('multiple', '');
    }
    input.type = 'file';
    input.onchange = function () {
      for (var i = 0; i < input.files.length; i++) {
        var file = input.files[i];
        console.log('file selected: ' + file.name);
        file.arrayBuffer().then(function (arrayBuffer) {
          var array = new Uint8Array(arrayBuffer);
          var path = '/tmp/' + file.name;

          var stream = FS.open(path, 'w+');
          var retCode = 0;

          if (stream) {
            FS.write(stream, array, 0, file.size);
            FS.close(stream);
          } else {
            retCode = 1;
          }

          ccall('OpenFileCallback', 'void', ['string', 'number'], [path, retCode]);
        });
      }
    };
    input.click();
  };

  var downloadFile = function (filename, size, data) {
    var link = document.createElement('a');

    var sharedArray = new Uint8Array(Module.HEAPU8.buffer, data, size);
    // Blob fails when passed SharedArrayBuffer
    var array = new Uint8Array(sharedArray);
    var blob = new Blob([array], {type: 'application/octet-stream'});

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  /* wxLocalStorageConfig */

  var hasConfigEntry = function (key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  var hasConfigGroup = function (key) {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).startsWith(key)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  var getConfigEntryCount = function (prefix, recurse) {
    var entryCount = 0;

    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          var end = key.indexOf('/', prefix.length);
          if (end == -1 || recurse) {
            ++entryCount;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
    return entryCount;
  };

  var getConfigEntryIndex = function (prefix, index) {
    var entryCount = 0;

    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          var end = key.indexOf('/', prefix.length);
          if (end == -1) {
            if (entryCount >= index) {
              return i;
            } else {
              ++entryCount;
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
    return -1;
  };

  var getConfigGroupCount = function (prefix, recurse) {
    var children = new Set();

    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          var end = key.indexOf('/', prefix.length);
          if (end != -1) {
            if (recurse) {
              end = key.lastIndexOf('/');
            }
            var child = key.substring(prefix.length, end);
            if (!children.has(child)) {
              children.add(child);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
    return children.size;
  };

  var getConfigGroupIndex = function (prefix, index) {
    var children = new Set();

    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          var end = key.indexOf('/', prefix.length);
          if (end != -1) {
            var child = key.substring(prefix.length, end);
            if (!children.has(child)) {
              if (children.size >= index) {
                return i;
              } else {
                children.add(child);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
    return -1;
  };

  var getConfigKeyLength = function (index) {
    try {
      return localStorage.key(index).length;
    } catch (error) {
      console.error(error);
      return 0;
    }
  };

  var getConfigKey = function (index, keyBuffer, length) {
    try {
      var key = localStorage.key(index);
      stringToUTF8(key, keyBuffer, length);
    } catch (error) {
      console.error(error);
    }
  };

  var getConfigEntryLength = function (key) {
    var value = null;
    try {
      value = localStorage.getItem(key);
    } catch (error) {
      //console.error(error);
    }

    if (value === null) {
      return -1;
    } else {
      return value.length
    }
  };

  var getConfigEntry = function (key, valueBuffer, length) {
    try {
      var value = localStorage.getItem(key);
      if (value !== null) {
        stringToUTF8(value, valueBuffer, length);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  var setConfigEntry = function (key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(error);
    }
  };

  var removeConfigEntry = function (key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(error);
      }
  };

  var removeConfigGroup = function (group) {
    try {
      var keysToRemove = [];

      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(group)) {
          keysToRemove.push(key);
        }
      }
      for (var i = 0; i < keysToRemove.length; i++) {
        localStorage.removeItem(keysToRemove[i]);
      }
      return keysToRemove.length > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  var clearConfig = function () {
    try {
      localStorage.clear();
    } catch (error) {
      console.error(error);
    }
  };

  var renameConfigGroup = function (oldGroup, newGroup) {
    try {
      var keysToRename = [];

      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(oldGroup)) {
          keysToRename.push(key);
        } else if (key.startsWith(newGroup)) {
          return false;
        }
      }

      if (keysToRename.length > 0) {
        for (var i = 0; i < keysToRename.length; i++) {
          var oldKey = keysToRename[i];
          var newKey = newGroup + oldKey.substring(oldGroup.length);

          var value = localStorage.getItem(oldKey);
          localStorage.setItem(newKey, value);
          localStorage.removeItem(oldKey);
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }

  };

  /* HTML5 Drag and Drop Support */

  var pendingDropFiles = [];
  var pendingDropX = 0;
  var pendingDropY = 0;

  var registerDragDropHandlers = function () {
    var canvas = Module.canvas;
    if (!canvas) {
      console.error('[DND] Module.canvas not available');
      return;
    }

    // Prevent default to enable drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
      canvas.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    canvas.addEventListener('dragenter', function (e) {
      console.log('[DND] dragenter');
      ccall('OnDragEnter', 'void', ['number', 'number'], [e.clientX, e.clientY]);
    });

    canvas.addEventListener('dragleave', function (e) {
      console.log('[DND] dragleave');
      ccall('OnDragLeave', 'void', [], []);
    });

    canvas.addEventListener('drop', function (e) {
      var files = e.dataTransfer.files;
      console.log('[DND] drop: ' + files.length + ' files');

      // Get canvas-relative coordinates
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      pendingDropFiles = [];
      pendingDropX = x;
      pendingDropY = y;

      if (files.length === 0) {
        return;
      }

      // Process all files, then notify C++ when all are ready
      var processedCount = 0;

      for (var i = 0; i < files.length; i++) {
        (function (file) {
          file.arrayBuffer().then(function (arrayBuffer) {
            var array = new Uint8Array(arrayBuffer);
            var path = '/tmp/' + file.name;

            // Write to WASM filesystem
            var stream = FS.open(path, 'w+');
            if (stream) {
              FS.write(stream, array, 0, file.size);
              FS.close(stream);
              pendingDropFiles.push(path);
              console.log('[DND] Wrote file: ' + path + ' (' + file.size + ' bytes)');
            } else {
              console.error('[DND] Failed to write file: ' + path);
            }

            processedCount++;
            if (processedCount === files.length) {
              // All files processed, notify C++
              notifyDropComplete();
            }
          }).catch(function (error) {
            console.error('[DND] Error reading file: ' + error);
            processedCount++;
            if (processedCount === files.length) {
              notifyDropComplete();
            }
          });
        })(files[i]);
      }
    });

    console.log('[DND] Drag and drop handlers registered');
  };

  var notifyDropComplete = function () {
    if (pendingDropFiles.length === 0) {
      return;
    }

    // Notify C++ for each file
    for (var i = 0; i < pendingDropFiles.length; i++) {
      ccall('OnFileDropped', 'void',
            ['string', 'number', 'number'],
            [pendingDropFiles[i], pendingDropX, pendingDropY]);
    }

    // Clear pending files
    pendingDropFiles = [];
  };

