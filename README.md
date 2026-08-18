# 🎵 Pulse Music Player

### 🌐 Live Demo

**[https://pulse-music-player-xi.vercel.app/](https://pulse-music-player-xi.vercel.app/)**

A modern, responsive web-based music player built with **Next.js, React, TypeScript, Tailwind CSS, and Lucide Icons**.

Pulse provides a Spotify-inspired music experience with playlists, search, genre filtering, persistent liked songs, playback controls, and a responsive bottom music player.

---

## ✨ Features

- 🎵 Play and pause music
- ⏮️ Previous track
- ⏭️ Next track
- 🔀 Shuffle playback
- 🔁 Repeat playback
- 🎚️ Audio progress/seek bar
- 🔊 Volume control
- 🔇 Mute/unmute
- ❤️ Like/unlike songs
- 💾 Persistent liked songs using localStorage
- 💾 Persistent current track
- 💾 Persistent volume, shuffle, and repeat settings
- 🔎 Search songs, artists, and albums
- 🎼 Browse music by genre
- 📚 Playlist functionality
- 🎧 Auto-play next track
- 📱 Responsive mobile layout
- 📂 Mobile navigation sidebar
- 🖼️ Album artwork for tracks
- ⚡ Fast and responsive Next.js interface

---

## 📋 Internship Task

### Task 3: Music Player

The project fulfills the following internship requirements:

- Design a web-based music player with playlist functionality.
- Include features for searching and categorizing music.
- Implement play, pause, skip, and volume control functionalities.

---

## 🛠️ Technologies Used

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Lucide React**
- **HTML5 Audio API**
- **localStorage**
- **Vercel**

---

## 🎧 Music Player Controls

The bottom music player includes:

- Current track artwork
- Song title and artist
- Like button
- Shuffle
- Previous
- Play/Pause
- Next
- Repeat
- Track progress bar
- Current time and duration
- Volume control
- Mute/unmute

The player automatically advances to the next track when a song finishes.

---

## 📚 Playlist System

Pulse includes:

- ❤️ Liked Songs
- 🎧 Deep Focus
- 🌙 Late Night

Liked songs are stored in the browser using `localStorage`, so the user's liked music remains available after refreshing the page.

---

## 🔎 Search & Genre Filtering

Users can search through the music library by:

- Song title
- Artist
- Album

Music can also be filtered by genre using the genre navigation.

---

## 💾 Persistent Settings

The application saves the following preferences locally:

- Liked songs
- Current track
- Volume
- Shuffle mode
- Repeat mode

This allows the music experience to continue across page reloads.

---

## 📱 Responsive Design

The interface is designed to work across:

- 💻 Desktop
- 💻 Laptop
- 📱 Mobile
- 📱 Tablet

The sidebar automatically changes into a mobile navigation menu on smaller screens.

---

## 📂 Project Structure

```text
pulse-music-player/
│
├── app/
│   └── page.tsx
│
├── components/
│   └── music/
│       └── MusicPlayer.tsx
│
├── data/
│   └── tracks.ts
│
├── hooks/
│   └── useAudioPlayer.ts
│
├── public/
│   ├── audio/
│   │   ├── afterglow.mp3
│   │   ├── city-lights.mp3
│   │   ├── electric-soul.mp3
│   │   ├── golden-hour.mp3
│   │   ├── midnight-drive.mp3
│   │   ├── orbit.mp3
│   │   ├── slow-motion.mp3
│   │   └── street-dreams.mp3
│   │
│   └── covers/
│       ├── afterglow.jpg
│       ├── city-lights.jpg
│       ├── electric-soul.jpg
│       ├── golden-hour.jpg
│       ├── midnight-drive.jpg
│       ├── orbit.jpg
│       ├── slow-motion.jpg
│       └── street-dreams.jpg
│
├── types/
│   └── music.ts
│
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
└── README.md

```

---

## 🚀 Run Locally

Clone the repository:

```bash
git clone https://github.com/Maheenjawad31/pulse-music-player.git

```

Move into the project:

```bash
cd pulse-music-player

```

Install dependencies:

```bash
npm install

```

Start the development server:

```bash
npm run dev

```

Open:

```text
http://localhost:3000

```

---

## 🌐 Deployment

The project is deployed using **Vercel**.

### Live Application

[https://pulse-music-player-xi.vercel.app/](https://pulse-music-player-xi.vercel.app/)

---

## 👩‍💻 Developer

**Maheen Jawad**

**Internship Domain:** Web Development

---

## 📌 Internship Project

This project was developed as part of the **Arch Technologies Web Development Internship**.

The implementation focuses on creating a functional and responsive music player while demonstrating React component development, state management, browser storage, audio controls, filtering, search, playlist functionality, and deployment.

---

## 📄 License

This project was created for educational and internship purposes.

