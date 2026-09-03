# [WASM OS Playground](http://os.unlim8ted.com/)

An experimental browser-based operating system playground built with WebAssembly, Gecko, v86 Linux, a persistent virtual filesystem, and installable HTML/WASM applications.

This repository is a sandbox for exploring how far a browser can be pushed toward behaving like a complete desktop operating system.

## Goals

- Run a real browser engine in WebAssembly
- Run a real Linux environment in the browser
- Share files between apps and Linux
- Store apps inside a persistent virtual filesystem
- Support installable HTML/WASM applications
- Build a ChromeOS-inspired desktop shell
- Experiment with large browser-native applications and games
- Keep as much of the system as possible self-contained

## Current Stack

### Browser

Gecko / Firefox compiled to WebAssembly using:

- `firefox-wasm`
- `gecko.js`
- WebAssembly threads
- Wisp networking

The browser UI is custom and designed to resemble Chrome rather than Firefox.

### Linux

Terminal runs Linux through:

- v86
- Buildroot
- WebAssembly

The Linux environment is intended to share the same user-facing filesystem as the rest of the OS.

### Filesystem

The system uses a persistent virtual filesystem for:

```text
/
├── Applications/
├── home/
│   └── user/
│       ├── Desktop/
│       ├── Documents/
│       ├── Downloads/
│       ├── Music/
│       └── Pictures/
├── System/
└── tmp/
