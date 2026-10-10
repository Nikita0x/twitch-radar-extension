import { resolve } from 'node:path';
import { defineConfig } from 'wxt';

// Public half of a locally-generated RSA key pair, used only to pin the
// Chrome/Chromium extension ID (see `key` below). Not a secret — Chrome
// re-signs on publish, this key only fixes the ID during local unpacked
// installs, otherwise the ID is re-hashed from the build's absolute path
// and changes whenever that path changes, breaking the OAuth redirect URI
// registered with Twitch every time.
const CHROMIUM_DEV_PUBLIC_KEY =
	'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4YPqMhtV7dM6KFBdD1izLvwlxglCRGaNDVdNTwKXk6O2lAYqOc+bmeFddSVry/kdwuappyVxvtPvmdr1ssja4+6NIxwRuBGuW1+dwdHGNCLBuUu8vgbs9WsIJKiyi1i8N68Bc9hLYpol6bcxKg12ZBvsW/GWLauei3cTDnk+XOOw3WQRIiwRjOel2eMQBc+1YtsfSAFbC6+oijOUZrBvxFh6xhtFZm6XzzYkNhzp7MVyLi+jLLEH+1qMPqs0oi/zWYBTSswolPl+YEEGXEzFZX+ugPDz1EoOLK3vF1rO7PKra5nq1QMTQMkKk11eAK/ByFLuP2XkFhJHJKmduvj6owIDAQAB';

// Dev-server builds use color-inverted copies (src/public/dev/) so an unpacked
// dev install is easy to tell apart from the store install.
function icons(command: 'build' | 'serve', sizes: number[]) {
	const dir = command === 'serve' ? 'dev/' : '';
	return Object.fromEntries(sizes.map((size) => [size, `${dir}icon${size}.png`]));
}

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	// Unlike entrypointsDir, WXT resolves publicDir relative to the project root,
	// not srcDir — has to be set explicitly since public/ lives under src/.
	publicDir: 'src/public',
	modules: ['@wxt-dev/module-vue'],
	// `shared/` lives outside srcDir (also imported by worker/), so it needs its
	// own alias — WXT's built-in `@` only covers src/.
	alias: {
		'@shared': resolve(__dirname, 'shared'),
	},
	hooks: {
		// The hook's return value is ignored — the array has to be mutated in place.
		'build:publicAssets': (wxt, files) => {
			if (wxt.config.command !== 'build') return;

			const prodFiles = files.filter((file) => !file.relativeDest.startsWith('dev/'));
			files.splice(0, files.length, ...prodFiles);
		},
	},
	manifest: ({ browser, command }) => ({
		name: 'Twitch Radar – Live Stream Notifications',
		description: 'Get desktop notifications when your favorite Twitch streamers go live.',
		version: '1.7.0',
		permissions: ['notifications', 'identity', 'storage', 'alarms'],
		host_permissions: ['https://api.twitch.tv/*'],
		icons: icons(command, [16, 32, 48, 128]),
		action: {
			default_icon: icons(command, [16, 32]),
		},
		// Pins the Chrome extension ID to anejamjbmgpekamgljajekmgnbppnjao,
		// independent of the build's absolute path. Dev-server only (`command
		// === 'serve'`) — the Chrome Web Store derives the real key/ID from the
		// developer account on upload, and rejects a `build`/`zip` package whose
		// manifest carries a `key` that doesn't match what it already has on
		// file for the listing ("key field value in the manifest doesn't match
		// the current item").
		...(browser === 'chrome' && command === 'serve'
			? { key: CHROMIUM_DEV_PUBLIC_KEY }
			: browser === 'chrome'
				? {}
				: {
						// Fixed Firefox add-on ID. Keeps `browser.identity.getRedirectURL()`
						// (and the moz-extension:// URL in general) stable across
						// rebuilds/reinstalls — required for the OAuth redirect URI
						// registered with Twitch to keep working.
						browser_specific_settings: {
							gecko: {
								id: 'twitch-radar@nikita0x',
								// Required by Mozilla for new extensions since 2025-11-03. Twitch
								// data stays local or goes straight to Twitch's API with the
								// user's own token, so nothing is collected as a condition of use.
								// The uninstall survey (worker/src/uninstall.html) does send
								// technical/diagnostic info (reason, version, OS, browser, extension
								// ID), but only when a user opts in to submit it — and
								// technicalAndInteraction is only valid under `optional`, Firefox
								// rejects it under `required`. See docs/privacy-policy.html for the
								// full disclosure.
								data_collection_permissions: {
									required: ['none'],
									optional: ['technicalAndInteraction'],
								},
							},
						},
					}),
	}),
});
