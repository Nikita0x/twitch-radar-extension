# Twitch Radar

![Twitch Radar Icon](src/public/icon128.png)

A fast, lightweight browser extension that tracks your followed Twitch streamers and sends desktop notifications when they go live.

[<img src="src/public/firefox.png" alt="Firefox Add-ons store link" height="60px">](https://addons.mozilla.org/en-US/firefox/addon/twitch-radar-live-notifs/)
[<img src="src/public/chrome.png" alt="Chrome Web Store link" height="60px">](https://chromewebstore.google.com/detail/fcjbgobfppjggabcbbnngehhefllbllm)

## Features 

- 🔴 Instant desktop notifications when followed streamers go live
- ⚙️ Per-streamer notification settings with customizable alerts and auto-open actions
- 🔍 Search through your followed channels
- 📊 Sort streams by viewer count or stream duration
- ⚡ Fast and lightweight interface
- 🌙 Light and dark themes
- 👤 Secure sign in with your Twitch account
- 🔒 Read-only access — your password is never shared or stored

## Installation

### Load unpacked (for development)

1. Clone the repo
2. Run `npm install` and `npm run build`
3. Open `chrome://extensions/`
4. Enable **Developer mode**
5. Click **Load unpacked** and select the `.output/chrome-mv3/` folder

## Build Commands

```sh
npm install             # install dependencies
npm run dev             # start WXT dev server with HMR (Chrome)
npm run dev:firefox      # start WXT dev server with HMR (Firefox)
npm run build            # production build for Chrome (.output/chrome-mv3)
npm run build:firefox    # production build for Firefox (.output/firefox-mv2)
npm run zip              # zip the Chrome build for store submission
npm run zip:firefox      # zip the Firefox build for store submission
npm run check            # TypeScript type check
npm run format           # format project with prettier
```

## Report an Issue

Found a bug or have a feature request? [Open an issue](https://github.com/Nikita0x/chrome-extension/issues) on GitHub.

> **Note (WIP):** in-app errors aren't surfaced to the user yet — they only go to the extension's console (`console.error`). Planned: a visible error banner that also prints `browser.runtime.id`, so a bug screenshot alone is enough to tell which build (dev vs. Chrome Web Store vs. Firefox) reported it. See `TODO.md`.


## Local development

After cloning the repository, create `worker/.dev.vars`
(the file is gitignored and is not included in the repository).

Required local secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Use the same values configured as Production secrets in Cloudflare.

## Contributing

Pull requests are welcome! If you'd like to help improve Twitch Radar, feel free to fork the repo and submit a PR.
