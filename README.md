# கடைசி பஸ் — Kadaisi Bus

**Tamil songs for the last bus home.**

A single-page music site inspired by [saloon.wtf](https://saloon.wtf). Pick a route on the
night bus stand, and the driver's cassette deck plays Tamil songs from YouTube — no songs
are hosted here; audio comes from a hidden [YouTube IFrame player](https://developers.google.com/youtube/iframe_api_reference).

## Routes

| Board | Tamil | Source |
|---|---|---|
| 47 · NILA MAIL | நிலா மெயில் — Moon Mail | YouTube Mix |
| 21 · KANAVU EXPRESS | கனவு எக்ஸ்பிரஸ் — Dream Express | Curated playlist |
| 60 · KAADHAL DELUXE | காதல் டீலக்ஸ் — Romance Special | YouTube Mix |
| 00 · PAATHI RAATHIRI | பாதி ராத்திரி — The Midnight Run | YouTube Mix (only appears 12–5 AM) |

Playlist IDs live in the `ROUTES` config at the top of the script in `index.html`.

## The rules of the bus

- Once you board, you ride: play/pause only — no skipping, no scrubbing, no song titles.
- Each route changes the night: moonlight, dream haze, vintage romance, or deep midnight.
- Some nights it rains (`?rain` to force). The midnight bus appears only after 12 AM (`?midnight` to force).

## Running locally

Any static server works:

```bash
npx serve .
```

The whole site is one dependency-free `index.html` — deployable as-is to GitHub Pages,
Netlify, or Vercel.
