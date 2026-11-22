# Tag

[![0rwx: r (read)](https://img.shields.io/badge/0rwx-r%20(read)-blue)](https://0rwx.com/)
[![0rwx: w (write)](https://img.shields.io/badge/0rwx-w%20(write)-yellow)](https://0rwx.com/)

A learning and test repository for building a top-down **Tag** game in Rust using the [Bevy](https://bevyengine.org/) game engine.

## Game Concept

- **Arena:** A simple, bounded top-down 2D scene.
- **Movement:** The main player runs **1.2× faster** than non-player characters (NPCs).
- **Elimination & Rounds:** Whichever player is **"it"** for too long loses and is eliminated. A new round then begins with the remaining players until a single winner is left.
- **Dynamic Timer:** The allowed time to be "it" follows an inverse function of the player count — more players means shorter rounds, while fewer players means longer rounds (e.g., $T(n) = \frac{k}{n}$ or a similar inverse curve).

## Tech Stack & Environment

- **Language:** Rust (latest stable via `rust-overlay`)
- **Engine:** [Bevy](https://bevyengine.org/)
- **Dev Environment:** Cross-platform [Nix](https://nixos.org/) flake (`flake.nix`) supporting macOS (`aarch64-darwin`, `x86_64-darwin`) and Linux (`x86_64-linux`, `aarch64-linux`), loaded via [direnv](https://direnv.net/) (`.envrc`) with local environment variables in `.env`.

### Getting Started

With `direnv` installed globally:

```bash
direnv allow
```

Or enter the Nix devshell directly:

```bash
nix develop
```

Run the project:

```bash
cargo run
```

## AI Usage — 0rwx Framework

This project follows the [0rwx framework](https://0rwx.com/) for transparent, intentional AI usage:

- **`r` (Read) — Primary mode:** We strive to stay in **`r`**, using LLMs to ask questions, discuss Rust/Bevy concepts, and review ideas or small snippets while implementing the code by hand.
- **`w` (Write) — Occasional:** We may occasionally allow **`w`** for small, explicitly requested, and fully audited edits (such as project setup or documentation).
- **`x` (Execute) — Never:** We **never** use **`x`** (autonomous or unaudited AI-generated code).
