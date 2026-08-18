# 🎵 Pulse Music Player

A modern, responsive web-based music player built with **Next.js, TypeScript, Tailwind CSS, and the HTML5 Audio API**.

## 👤 Developer

**Name:** Maheen Jawad  
**Internship Domain:** Web Development  
**Project:** Task 3 — Music Player

---

## ✨ Features

- 🎵 Play and pause music
- ⏮️ Previous track
- ⏭️ Next track
- 🔀 Shuffle playback
- 🔁 Repeat playback
- 🎚️ Track progress bar with seek control
- 🔊 Volume control
- 🔇 Mute/unmute
- ❤️ Like/unlike songs
- 💾 Persistent liked songs using localStorage
- 💾 Persistent current track
- 💾 Persistent volume, shuffle, and repeat settings
- 🔎 Search songs, artists, and albums
- 🎼 Genre filtering
- 📁 Playlist functionality
- 📱 Responsive mobile navigation
- ▶️ Automatic next-track playback
- 🖼️ Album artwork for every track
- 🌙 Dark modern music-player interface

## 🛠️ Technologies Used

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Lucide React**
- **HTML5 Audio API**
- **localStorage**
- **Vercel**

## 📂 Project Structure

```text
pulse-music-player/
├── app/
│   └── page.tsx
├── components/
│   └── music/
│       └── MusicPlayer.tsx
├── data/
│   └── tracks.ts
├── hooks/
│   └── useAudioPlayer.ts
├── public/
│   ├── audio/
│   └── covers/
├── types/
│   └── music.ts
├── .gitignore
├── next.config.ts
├── package.json
└── README.md

```

## 🎧 Music Player Functionality

The application uses a custom `useAudioPlayer` hook to manage the HTML5 audio element.

The hook handles:

- Audio loading
- Play/pause state
- Current playback time
- Track duration
- Volume
- Seeking
- Track completion
- Automatic playback
- Audio cleanup when tracks change

The main `MusicPlayer` component manages the user interface and higher-level functionality such as playlists, search, genres, likes, shuffle, repeat, and track navigation.

## 💾 Local Storage

The application saves user preferences in the browser using `localStorage`.

Saved information includes:

```text
pulse-liked-songs
pulse-volume
pulse-shuffle
pulse-repeat
pulse-current-track

```

This allows selected preferences and liked songs to remain available after refreshing the page.

## 📋 Internship Requirement — Task 3

The project fulfills the required Music Player functionality:

### Playlist Functionality

Users can browse and select playlists including:

- Liked Songs
- Deep Focus
- Late Night

### Music Search

Users can search by:

- Song title
- Artist
- Album

### Music Categorization

Songs can be filtered by genre.

### Playback Controls

The player includes:

- Play
- Pause
- Previous
- Next
- Shuffle
- Repeat
- Progress/seek control
- Volume control
- Mute/unmute

## 🚀 Run Locally

Clone the repository:

```bash
git clone https://github.com/Maheenjawad31/pulse-music-player.git

```

Open the project:

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

## 🌐 Deployment

The project is designed for deployment using **Vercel**.

The production deployment can be connected directly to the GitHub repository:

```text
https://github.com/Maheenjawad31/pulse-music-player

```

## 🔒 Project Notes

Environment files and generated dependencies are excluded through `.gitignore`.

The following are not intended to be committed:

```text
node_modules/
.next/
.env*
.vercel/

```

## 📄 Internship Submission

This project was completed as part of the **Web Development Internship**.

**Developer:** Maheen Jawad  
**Domain:** Web Development  
**Task:** Task 3 — Music Player

---

⭐ Built with Next.js and TypeScript.