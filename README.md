<div align="center">

# 🌌 Aetheria Hi-Res Audio Player

**Audiophile Flagship Desktop Music Player with Space-Age Glassmorphism UI & Native Apple Silicon Optimization**

[![Platform: macOS (Apple Silicon)](https://img.shields.io/badge/Platform-macOS%20M1%2F%2FM2%2F%2FM3-00f2fe?style=for-the-badge&logo=apple&logoColor=white)](https://apple.com)
[![Electron](https://img.shields.io/badge/Electron-31.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Audio Engine: 64-bit Float](https://img.shields.io/badge/Audio%20Engine-64--bit%20Float%20DSP-8b5cf6?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

<p align="center">
  A state-of-the-art desktop audio player engineered for uncompromising audiophiles, featuring zero-click 10-band DSP equalization, real-time 60 FPS cosmic visualizers, and pristine Hi-Res lossless playback.
</p>

</div>

---

## ✨ Features at a Glance

### 🎧 Audiophile-Grade Sound Engine
- **Bit-Perfect Lossless & Hi-Res Parsing**: Native support for **FLAC**, **ALAC (m4a)**, **WAV**, **AIFF**, **MP3**, **AAC**, and **OGG**.
- **Hi-Res Audio Metadata**: Real-time analytical readout of **Sample Rate** (up to 384 kHz), **Bit Depth** (16 / 24 / 32-bit float), **Bitrate**, **Codec**, **Channels**, and **Dynamic Range (DR)**.
- **Zero-Click 10-Band Equalizer**: Built with consecutive `BiquadFilterNode` stages and smooth logarithmic gain transitions (`setTargetAtTime`), ensuring artifact-free adjustments.
- **Nebula 3D Spatializer**: Psychoacoustic spatial sound enhancement for widened stereo imaging.
- **Reference & Genre Presets**: Includes *Pure Direct (Flat)*, *Studio Master Reference*, *Cosmic Immersion*, *Deep Nebula Bass*, plus genre profiles (*Electronic/EDM*, *Synthwave*, *Rock/Metal*, *Jazz*, *Classical*, *Hip-Hop*, *Pop*, *Lofi/Ambient*).

### 🌌 60 FPS Space-Age Visualizers
Accelerated canvas visualizers optimized for Apple Silicon and Retina/5K Pro Displays:
1. **Orbital Core Reactor**: A circular radial spectrogram surrounding a pulsing cosmic energy core.
2. **Stellar Warp Drive**: A 3D starfield with bass-driven hyperjump acceleration and neon oscilloscope overlay.
3. **Aurora Cyber Spectrum**: A 64-band precision frequency analyzer with Peak Hold tracking.

### 💎 Space Luxury UI / UX
- **Glassmorphism Aesthetic**: Deep obsidian and neon violet palette (`#070811`, `#00f2fe`, `#8b5cf6`, `#ec4899`) with frosted glass layers (`backdrop-filter: blur(28px)`).
- **Built-In Realtime Hi-Res Demo Generator**: Instantly test audio frequency response and visualizers right out of the box.

---

## 🏗️ Architecture & Stack

- **Framework**: Electron 31 (native `arm64` binary target)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Audio Processing**: Web Audio API (`AudioContext`, `AnalyserNode` FFT 4096, `BiquadFilterNode`, `GainNode`)
- **Metadata Parser**: `music-metadata` executed safely within the Electron Main Process via IPC
- **Packaging**: `electron-builder` (`.dmg` installer for Apple Silicon M1/M2/M3)

---

## 🚀 Getting Started

### Prerequisites
- **macOS** with Apple Silicon (M1, M2, or M3)
- **Node.js** (v18 or v20+) & **npm**

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Aetheria-HiRes-Player.git
   cd Aetheria-HiRes-Player
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in Development Mode:**
   ```bash
   npm run dev
   ```

### 📦 Building Native macOS `.dmg` Installer

To compile and package the application into an Apple Silicon `.dmg` installer:
```bash
npm run dist
```
The generated `.dmg` will be located in:
```bash
dist/Aetheria-HiRes-Player-1.0.0-arm64.dmg
```

---

## 📜 License

Distributed under the **MIT License**. Engineered with passion for music and code.
