const catalog = [
    {
        "id": "browser",
        "name": "Browser",
        "icon": "chrome",
        "desc": "Browse the web.",
        "localPath": null,
        "svg": `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48" height="48" width="48">   <defs>     <linearGradient id="a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">       <stop offset="0" stop-color="#d93025" />       <stop offset="1" stop-color="#ea4335" />     </linearGradient>     <linearGradient id="b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">       <stop offset="0" stop-color="#fcc934" />       <stop offset="1" stop-color="#fbbc04" />     </linearGradient>     <linearGradient id="c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">       <stop offset="0" stop-color="#1e8e3e" />       <stop offset="1" stop-color="#34a853" />     </linearGradient>   </defs>   <circle cx="24" cy="23.9947" r="12" style="fill:#fff" />   <path d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z" style="fill:none" />   <path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" style="fill:url(#a)" />   <circle cx="24" cy="24" r="9.5" style="fill:#1a73e8" />   <path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" style="fill:url(#b)" />   <path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" style="fill:url(#c)" /> </svg>`
    },
    {
        "id": "files",
        "name": "Files",
        "icon": "files",
        "desc": "Browse and manage files.",
        "localPath": null,
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#8ab4f8" d="M5 12a4 4 0 0 1 4-4h11l5 5h14a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/>
    <path fill="#5f9cf6" d="M5 18h38v19a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/>
    <path fill="#7fb0fa" d="M5 32h38v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/>
  </svg>`
    },
    {
        "id": "store",
        "name": "App Store",
        "icon": "store",
        "desc": "Discover and install apps.",
        "localPath": null,
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="36" height="34" rx="8" fill="#fff"/>
    <path d="M16 18h16" stroke="#4285f4" stroke-width="3" stroke-linecap="round"/>
    <path d="M19 8c0-3 2-5 5-5s5 2 5 5" fill="none" stroke="#9aa0a6" stroke-width="3" stroke-linecap="round"/>
    <path fill="#34a853" d="m20 20 13 8-13 8z"/>
    <path fill="#fbbc04" d="m20 20 6.5 4-6.5 4z"/>
    <path fill="#4285f4" d="m20 28 6.5-4 6.5 4-13 8z" opacity=".9"/>
  </svg>`
    },
    {
        "id": "terminal",
        "name": "Terminal",
        "icon": "terminal",
        "desc": "Command-line terminal.",
        "localPath": null,
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="#30343a"/>
    <path d="m14 18 7 6-7 6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 31h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  </svg>`
    },
    {
        "id": "settings",
        "name": "Settings",
        "icon": "settings",
        "desc": "Configure system settings.",
        "localPath": "apps/settings/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5f6368" d="m28.7 5 1.2 4.3a16 16 0 0 1 3.5 2l4.3-1.1 4 6.9-3.1 3.2c.3 1.2.4 2.5.4 3.7s-.1 2.5-.4 3.7l3.1 3.2-4 6.9-4.3-1.1a16 16 0 0 1-3.5 2L28.7 43h-8l-1.2-4.3a16 16 0 0 1-3.5-2l-4.3 1.1-4-6.9 3.1-3.2a16 16 0 0 1 0-7.4l-3.1-3.2 4-6.9 4.3 1.1a16 16 0 0 1 3.5-2L20.7 5z"/>
    <circle cx="24.7" cy="24" r="7" fill="#e8eaed"/>
    <circle cx="24.7" cy="24" r="3.5" fill="#5f6368"/>
  </svg>`
    },
    {
        "id": "notes",
        "name": "Notes",
        "icon": "notes",
        "desc": "Fast local notes with autosave.",
        "default": true,
        "localPath": "apps/notes/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="34" height="38" rx="7" fill="#fbbc04"/><path d="M15 16h18M15 23h18M15 30h13" stroke="#5f4b00" stroke-width="3" stroke-linecap="round"/></svg>`
    },
    {
        "id": "canvas",
        "name": "Canvas",
        "icon": "canvas",
        "desc": "Pressure-free drawing canvas with brush sizes, undo, clear, and PNG export.",
        "default": true,
        "localPath": "apps/canvas/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="c" x1="6" y1="42" x2="42" y2="6"><stop stop-color="#f28b82"/><stop offset=".34" stop-color="#fdd663"/><stop offset=".67" stop-color="#81c995"/><stop offset="1" stop-color="#8ab4f8"/></linearGradient></defs><rect x="5" y="5" width="38" height="38" rx="9" fill="url(#c)"/><path d="M15 32c7-1 7-11 17-16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="15" cy="32" r="4" fill="#fff"/></svg>`
    },
    {
        "id": "python",
        "name": "Python",
        "icon": "python",
        "desc": "Python code interpreter.",
        "linux": true,
        "localPath": "apps/python/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#3776ab" d="M23 5c-9 0-9 4-9 8v6h18v2H9c-5 0-8 4-8 10s3 10 8 10h5v-7c0-5 4-8 9-8h16c4 0 8-3 8-8v-5c0-5-4-8-9-8H23Z"/><circle cx="19" cy="11" r="2" fill="#fff"/><path fill="#ffd343" d="M25 43c9 0 9-4 9-8v-6H16v-2h23c5 0 8-4 8-10S44 7 39 7h-5v7c0 5-4 8-9 8H9c-4 0-8 3-8 8v5c0 5 4 8 9 8h15Z"/><circle cx="29" cy="37" r="2" fill="#fff"/></svg>`
    },
    {
        "id": "vscode",
        "name": "Code Editor",
        "icon": "code",
        "desc": "Code workspace backed by the Linux VM and shared filesystem.",
        "linux": true,
        "localPath": "apps/code-editor/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="38" height="38" rx="9" fill="#187bcd"/><path d="m12 24 8-8 6 5 9-8v22l-9-8-6 5-8-8Z" fill="#fff" fill-opacity=".95"/><path d="m26 21 9-8v22l-9-8Z" fill="#9cdcfe"/></svg>`
    },
    {
        "id": "ffmpeg",
        "name": "FFmpeg",
        "icon": "ffmpeg",
        "desc": "Local media conversion workspace.",
        "downloadSize": "~32 MB runtime on first launch",
        "localPath": "apps/ffmpeg/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" fill="#151515"/><path fill="#61d394" d="M13 12h22v6H19v6h14v6H19v8h-6z"/></svg>`
    },
    {
        "id": "vm-emulation",
        "name": "VM Emulation",
        "icon": "vm",
        "desc": "VM emulation launcher for bundled QEMU browser demos.",
        "localPath": "apps/vm-emulation/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="8" width="38" height="27" rx="5" fill="#263238"/><path d="m16 18 5 5-5 5M24 28h9" fill="none" stroke="#8ab4f8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 40h14" stroke="#90a4ae" stroke-width="3" stroke-linecap="round"/></svg>`
    },
    {
        "id": "godot",
        "name": "Godot",
        "icon": "godot",
        "desc": "Game engine editor.",
        "localPath": "apps/godot/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#478cbf" d="M8 18 14 9l6 5 4-8 4 8 6-5 6 9-2 22H10z"/><circle cx="18" cy="25" r="2.5" fill="#fff"/><circle cx="30" cy="25" r="2.5" fill="#fff"/><path d="M17 33c4 3 10 3 14 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`
    },
    {
        "id": "freecad",
        "name": "FreeCAD",
        "icon": "freecad",
        "desc": "Parametric CAD workspace.",
        "downloadSize": "~400 MB",
        "localPath": "apps/freecad/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="38" height="38" rx="9" fill="#2f74c0"/><path d="M13 12h23v7H21v6h13v7H21v10h-8Z" fill="#fff"/><circle cx="35" cy="34" r="7" fill="#d32f2f"/><path d="M35 29v10M30 34h10" stroke="#fff" stroke-width="2"/></svg>`
    },
    {
        "id": "audacity",
        "name": "Audacity",
        "icon": "audacity",
        "desc": "Audio editor workspace.",
        "localPath": "apps/audacity/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="38" height="38" rx="9" fill="#fbbc04"/><path d="M12 28c3-12 7-12 10 0s7 12 10 0 5-12 8 0" fill="none" stroke="#174ea6" stroke-width="4" stroke-linecap="round"/><path d="M11 17v20M37 17v20" stroke="#d93025" stroke-width="4" stroke-linecap="round"/></svg>`
    },
    {
        "id": "terraria",
        "name": "Terraria",
        "icon": "terraria",
        "desc": "Terraria game.",
        "downloadSize": "~559 MB",
        "localPath": "apps/terraria/index.html",
        "svg": `<svg width="800px" height="800px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">     <defs>         <style>             .outline {                 stroke:#000000;                 stroke-linecap:round;                 stroke-linejoin:round;             }             .trunk { fill:#9B633C; }             .leaves { fill:#69B96B; }             .shrub { fill:#8BCB72; }             .branch {                 fill:none;                 stroke:#000000;                 stroke-linecap:round;                 stroke-linejoin:round;             }         </style>     </defs>      <!-- Tree trunk -->     <path class="outline trunk"         d="M26.1632,19.99V38.3726c0,.4968,1.7113,3.0913,2.7049,3.0913s2.1529.4417,2.1529,1.2145-.3312.828-.7728.7728a22.6791,22.6791,0,0,0-2.3185-.7728c-.2208.11-1.6009.97-2.0425.7884a5.2268,5.2268,0,0,0-2.1345-.7888c-.6166.0277-.9569.822-1.84.8139-.6693-.0062-1.3985-.9239-2.3738-.8135-.4686.0531-1.0488.8148-1.49.8214s-.8832-.159-.8832-.8214c0,0,.6072-1.0488,1.1593-1.0488a3.5966,3.5966,0,0,0,1.7941-.6625,8.9531,8.9531,0,0,1,1.7941-2.4841V26.3383c0-.3864-.46-.9384-.46-1.7113s.46-.9936.46-1.4352V21.26"/>      <!-- Tree canopy -->     <path class="outline leaves"         d="M21.2676,4.6883A2.5733,2.5733,0,0,1,23.9,5.1772s.6231-.7376,1.2144-.6732a2.8923,2.8923,0,0,1,2.1713,1.9981s-.11-1.0857,1.5273-.7729a8.2851,8.2851,0,0,1,3.22,4.7843c1.8033.0736,1.8033,1.84.552,2.2817,1.4721.6993-.1472,1.84-.1472,1.84,1.0673.2944.4416,4.7475-3.0546,5.3547s-3.7538-.8648-3.7538-.8648-.5336,1.5824-1.8216,1.5272-.9937-1.4168-.9937-1.4168-.35,2.1713-1.6929,2.0793A1.6166,1.6166,0,0,1,19.594,19.99s-.92,1.2329-1.5641.4416a1.41,1.41,0,0,1-.4048-1.3616s-3.349.11-3.4594-2.5946,1.4537-3.1281,1.4537-3.1281-1.5457-.6257-1.1224-1.6561A2.3623,2.3623,0,0,1,16.153,10.44a4.9342,4.9342,0,0,1,.0552-3.3122c.7177-1.3248,3.9379-1.012,3.9379-1.012S20.0069,5.1866,21.2676,4.6883Z"/>      <!-- Branches -->     <line class="branch" x1="21.581" x2="18.395" y1="30.755" y2="29.018"/>     <line class="branch" x1="26.163" x2="29.555" y1="35.833" y2="33.725"/>      <!-- Right shrub -->     <path class="outline shrub"         d="M29.2226,30.44a1.9892,1.9892,0,0,1,3.2444.208s1.3311-.52,1.7054.4575a1.0682,1.0682,0,0,1-.4159,1.3935s1.442,1.2876.1525,2.4264-2.5789.7487-2.6621-.3882A1.6446,1.6446,0,0,1,29.6177,32S28.5362,31.2508,29.2226,30.44Z"/>      <!-- Left shrub -->     <path class="outline shrub"         d="M14.7959,30.7608a2.0158,2.0158,0,0,1-.6537-3.2545s-.8729-1.1723.0044-1.8044a1.1111,1.1111,0,0,1,1.5027.0351s.9037-1.7681,2.3839-.8034,1.4329,2.3409.319,2.7289a1.587,1.587,0,0,1-.3623,1.8869,1.6435,1.6435,0,0,1-1.74.402S15.7886,31.2191,14.7959,30.7608Z"/> </svg>`
    },
    {
        "id": "animal-crossing",
        "name": "Animal Crossing",
        "icon": "game",
        "desc": "Animal Crossing game.",
        "localPath": "apps/animal-crossing/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="9" fill="#8fd36f"/><path d="M8 31c7-9 14-9 20 0s10 7 12 3v10H8Z" fill="#4f9b4a"/><circle cx="17" cy="19" r="6" fill="#f4cf73"/><path d="M12 33h24" stroke="#8a5b39" stroke-width="4" stroke-linecap="round"/></svg>`
    },
    {
        "id": "cuphead",
        "name": "Cuphead",
        "icon": "game",
        "desc": "Cuphead game.",
        "downloadSize": "~2101 MB",
        "localPath": "apps/cuphead/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="9" fill="#f0d46a"/><circle cx="24" cy="25" r="12" fill="#fff" stroke="#21170f" stroke-width="3"/><path d="M16 13h18l-4 8H20z" fill="#d8342a" stroke="#21170f" stroke-width="3"/><circle cx="20" cy="25" r="2.5" fill="#21170f"/><circle cx="28" cy="25" r="2.5" fill="#21170f"/></svg>`
    },
    {
        "id": "doom-3",
        "name": "Doom 3",
        "icon": "game",
        "desc": "Doom 3 game.",
        "localPath": "apps/doom-3/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="9" fill="#130908"/><path d="M10 36 24 8l14 28H10Z" fill="#bd2b0c"/><path d="M19 31h10" stroke="#f4d0b0" stroke-width="4" stroke-linecap="round"/></svg>`
    },
    {
        "id": "untitled-goose-game",
        "name": "Untitled Goose Game",
        "icon": "game",
        "desc": "Untitled Goose Game.",
        "downloadSize": "~96 MB",
        "localPath": "apps/untitled-goose-game/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="9" fill="#9fd7ef"/><path d="M14 29c1-8 8-12 16-8 5 2 7 6 5 10-3 6-18 6-21-2Z" fill="#fff" stroke="#142018" stroke-width="3"/><path d="M33 20h9" stroke="#f18c2e" stroke-width="4" stroke-linecap="round"/></svg>`
    },
    {
        "id": "worldbox",
        "name": "WorldBox",
        "icon": "game",
        "desc": "WorldBox game.",
        "localPath": "apps/worldbox/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="9" fill="#061621"/><circle cx="24" cy="24" r="15" fill="#2d7db4"/><path d="M12 24c4-9 12-12 22-7-1 6-6 10-13 11-4 1-7 0-9-4Z" fill="#56a653"/></svg>`
    },
    {
        "id": "openscad",
        "name": "OpenSCAD",
        "icon": "openscad",
        "desc": "Parametric solid modeling editor.",
        "localPath": "apps/openscad/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="38" height="38" rx="9" fill="#f2c94c"/><path d="m24 10 13 7v14l-13 7-13-7V17Z" fill="none" stroke="#28527a" stroke-width="3"/><path d="m11 17 13 7 13-7M24 24v14" fill="none" stroke="#28527a" stroke-width="3"/></svg>`
    },
    {
        "id": "kicad",
        "name": "KiCad",
        "icon": "kicad",
        "desc": "Electronics design and PCB editor.",
        "localPath": "apps/kicad/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="38" height="38" rx="9" fill="#1f4f86"/><path d="M13 13h22v22H13z" fill="none" stroke="#8fd3ff" stroke-width="3"/><circle cx="18" cy="18" r="2.5" fill="#f4d35e"/><circle cx="30" cy="18" r="2.5" fill="#f4d35e"/><circle cx="18" cy="30" r="2.5" fill="#f4d35e"/><circle cx="30" cy="30" r="2.5" fill="#f4d35e"/><path d="M18 18h12M18 30h12M24 18v12" stroke="#f4d35e" stroke-width="2" stroke-linecap="round"/></svg>`
    },
    {
        "id": "minecraft",
        "name": "Minecraft",
        "icon": "minecraft",
        "desc": "Minecraft game.",
        "downloadSize": "~24 MB",
        "localPath": "apps/minecraft/Minecraft.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="42" height="42" rx="7" fill="#5b9c3d"/><path fill="#7a5334" d="M3 24h42v21H3z"/><path d="M11 9h9v8h8V9h9v16H11Z" fill="#72b64d" opacity=".9"/><rect x="15" y="29" width="6" height="6" fill="#3e2a1f"/><rect x="27" y="29" width="6" height="6" fill="#3e2a1f"/></svg>`
    },
    {
        "id": "celeste",
        "name": "Celeste",
        "icon": "game",
        "desc": "Celeste game.",
        "downloadSize": "~647 MB",
        "localPath": "apps/celeste/index.html",
        "svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">   <!-- Leaves -->   <path fill="#39b54a"     d="M28 15 18 7l2 12L9 16l10 10h26l10-10-11 3 2-12-10 8-4-13z"/>   <path fill="#238b3a"     d="M32 16 25 8l7 4 7-4-7 10z"/>    <!-- Strawberry -->   <path fill="#ef3340"     d="M15 23h34v8h-4v10h-5v8h-8v7h-4v-7h-8v-8h-5V31h-4v-8z"/>    <!-- Shadow -->   <path fill="#c81d32"     d="M15 31h5v10h5v8h7v7h-4v-7h-8v-8h-5z"/>    <!-- Highlight -->   <path fill="#ff5a67"     d="M20 23h24v5H20z"/>    <!-- Seeds -->   <g fill="#ffd166">     <rect x="22" y="30" width="3" height="4"/>     <rect x="31" y="27" width="3" height="4"/>     <rect x="40" y="31" width="3" height="4"/>     <rect x="26" y="39" width="3" height="4"/>     <rect x="36" y="38" width="3" height="4"/>     <rect x="31" y="47" width="3" height="4"/>   </g> </svg>`},
    {
        "id": "hollow-knight",
        "name": "Hollow Knight",
        "icon": "game",
        "desc": "Hollow Knight game.",
        "downloadSize": "~913 MB",
        "localPath": "apps/hollow-knight/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="9" fill="#18202b"/><path d="M16 16c-4-4-5-8-4-11 5 2 8 5 10 9h4c2-4 5-7 10-9 1 3 0 7-4 11 3 3 5 7 5 12 0 9-6 15-13 15S11 37 11 28c0-5 2-9 5-12Z" fill="#f3f5f7"/><circle cx="20" cy="25" r="2" fill="#18202b"/><circle cx="28" cy="25" r="2" fill="#18202b"/></svg>`
    },
    {
        "id": "hollow-knight-silksong",
        "name": "Hollow Knight Silksong",
        "icon": "game",
        "desc": "Hollow Knight Silksong game.",
        "localPath": "apps/hollow-knight-silksong/index.html",
        "svg": `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="9" fill="#7b1725"/><path d="M24 7c7 5 11 11 11 19 0 10-5 17-11 17s-11-7-11-17c0-8 4-14 11-19Z" fill="#f5efe7"/><path d="m16 14-7-7M32 14l7-7" stroke="#f5efe7" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="25" r="1.8" fill="#7b1725"/><circle cx="28" cy="25" r="1.8" fill="#7b1725"/></svg>`
    },
    {
        "id": "blender",
        "name": "Blender",
        "icon": "blender",
        "desc": "3D creation workspace.",
        "downloadSize": "~208 MB",
        "localPath": "apps/blender/index.html",
        "svg": `<svg xmlns="http://www.w3.org/2000/svg"      viewBox="0.499 48.118 511.002 415.763">    <!-- Orange outer Blender shape -->   <path     fill="#E87D0D"     d="M510.003 279.642c-2.998-21.097-10.305-41.104-21.725-59.459-9.959-16.019-22.738-30.266-37.991-42.375l.041-.038L290.133 54.731a4.569 4.569 0 0 0-.361-.287c-5.326-4.08-12.537-6.325-20.297-6.325-7.77 0-15.263 2.25-21.088 6.338-6.263 4.375-9.843 10.18-10.093 16.359-.229 5.765 2.521 11.312 7.764 15.636 10.31 8.135 20.597 16.447 30.898 24.769 9.997 8.08 20.298 16.401 30.549 24.502l-196.213-.133c-22.439 0-37.718 10.537-40.861 28.178-1.381 7.727 1.056 16.223 6.504 22.73 5.78 6.898 14.172 10.703 23.629 10.703l14.958.01c20.664 0 41.419-.051 62.146-.101l19.766-.046-178.08 131.748-.707.517C8.7 336.953 2.188 347.642.783 358.653c-1.065 8.342.881 15.965 5.63 22.053 5.66 7.258 14.497 11.25 24.885 11.25 10.205 0 20.618-3.867 29.334-10.908l96.166-78.7c-.411 3.843-.91 9.481-.853 13.573.108 6.479 2.188 19.479 5.481 30.033 6.804 21.69 18.265 41.535 34.063 58.963 16.438 18.132 36.458 32.509 59.5 42.722 24.36 10.774 50.547 16.243 77.836 16.243h.253c27.376-.066 53.646-5.622 78.085-16.519 23.08-10.334 43.091-24.769 59.467-42.898 15.778-17.517 27.223-37.395 34.014-59.067a151.124 151.124 0 0 0 6.416-33.003c.839-10.83.478-21.85-1.057-32.753z     M334.82 383.601     c-60.141 0-108.911-43.627-108.911-97.447     0-53.814 48.771-97.441 108.911-97.441     60.142 0 108.907 43.627 108.907 97.441     .002 53.82-48.765 97.447-108.907 97.447z"   />    <!-- White area between orange and blue -->   <ellipse     cx="334.82"     cy="286.154"     rx="108.911"     ry="97.447"     fill="#FFFFFF"   />    <!-- Blue center -->   <path     fill="#265787"     d="M397.627 277.591        c.887 16.063-5.529 30.978-16.796 42.019        -11.461 11.248-27.815 18.313-46.103 18.313        -18.28 0-34.637-7.065-46.102-18.313        -11.262-11.041-17.665-25.954-16.783-42.006        .864-15.603 8.475-29.376 19.939-39.128        11.273-9.589 26.41-15.439 42.945-15.439        16.537 0 31.67 5.852 42.944 15.439        11.47 9.752 19.083 23.515 19.956 39.115z"   />  </svg>`
    }
];
