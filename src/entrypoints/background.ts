import { ALARM_NAME, SETTINGS_SYNC_DEBOUNCE_MS } from '@/constants';
import { setBadge } from '@/services/badge.service';
import {
	getStorage,
	getStreamerNotifications,
	saveRuntime,
	type PreviousStream,
	type StreamerNotifications,
} from '@/services/storage.service';
import { fetchFollowedLiveStreams } from '@/services/twitch-api';
import { putUserSettings } from '@/services/cloudflare.service';
import { debounce } from '@/utils/utils';
import type { FollowData } from '@/stores/twitch.store';

export default defineBackground(() => {
	// Create a repeating alarm (every 30 seconds) when the extension is installed or updated.
	browser.runtime.onInstalled.addListener(() => {
		browser.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });
	});

	// Re-set on both install and startup (not just once) so the URL's baked-in
	// version query param stays current across extension updates.
	browser.runtime.onInstalled.addListener(updateUninstallUrl);
	browser.runtime.onStartup.addListener(updateUninstallUrl);

	async function updateUninstallUrl() {
		try {
			const url = new URL(`${import.meta.env.WXT_WORKER_URL}/uninstall`);
			url.searchParams.set('version', browser.runtime.getManifest().version);
			url.searchParams.set('os', (await browser.runtime.getPlatformInfo()).os);
			url.searchParams.set('id', browser.runtime.id);

			// Chrome and Firefox both support this; the URL must be http(s) since the
			// extension (and its internal pages) may already be gone by the time it opens.
			await browser.runtime.setUninstallURL(url.toString());
			console.log('[background] setUninstallURL set to', url.toString());
		} catch (err) {
			console.error('[background] setUninstallURL failed:', err);
		}
	}

	// Open the stream when the user clicks the "Open Stream" notification button.
	browser.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
		if (buttonIndex === 0) {
			browser.tabs.create({ url: `https://twitch.tv/${notificationId}` });
		}
	});

	// Firefox doesn't support notification buttons, so clicking the notification
	// body itself is the only way to open the stream there.
	browser.notifications.onClicked.addListener((notificationId) => {
		browser.tabs.create({ url: `https://twitch.tv/${notificationId}` });
		browser.notifications.clear(notificationId);
	});

	// Cloud sync lives here, not in the popup: a debounce timer in the popup dies
	// with it if the user closes the popup right after a change, silently
	// dropping the sync. The popup only writes storage.local.
	const syncSettingsToCloud = debounce(async () => {
		const { auth, userSettings } = await getStorage();

		if (!auth.isAuthenticated || !auth.accessToken) return;

		await putUserSettings(auth.accessToken, userSettings);
	}, SETTINGS_SYNC_DEBOUNCE_MS);

	browser.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === 'local' && changes.userSettings) {
			syncSettingsToCloud();
		}
	});

	/* ── OAuth handler ── */
	browser.runtime.onMessage.addListener((message) => {
		const msg = message as { type?: string; url?: string };

		if (msg.type !== 'OAUTH_LOGIN' || !msg.url) return;

		return handleOAuth(msg.url);
	});

	async function handleOAuth(url: string) {
		try {
			console.log('[background] Starting launchWebAuthFlow...');

			const redirectUrl = await browser.identity.launchWebAuthFlow({
				url,
				interactive: true,
			});

			if (!redirectUrl) {
				return {
					ok: false,
					error: 'Authorization was cancelled or not completed.',
				};
			}

			console.log('[background] OAuth completed:', redirectUrl);

			return {
				ok: true,
				redirectUrl,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);

			console.error('[background] OAuth error:', err);

			return {
				ok: false,
				error: message,
			};
		}
	}

	browser.alarms.onAlarm.addListener(async (alarm) => {
		if (alarm.name !== ALARM_NAME) return;

		const storage = await getStorage();

		if (!storage.auth.isAuthenticated) return;

		const liveStreamsResult = await fetchFollowedLiveStreams(
			storage.auth.accessToken,
			storage.auth.userId
		);

		if (!liveStreamsResult.ok) {
			console.error(liveStreamsResult.error);
			return;
		}

		const liveStreams = liveStreamsResult.data;

		if (liveStreams.length === 0) {
			await updateBadge(0);

			storage.runtime.previousStreams = {};
			storage.runtime.liveStreams = [];
			await saveRuntime(storage.runtime);

			return;
		}

		await updateBadge(liveStreams.length);

		storage.runtime.liveStreams = liveStreams;

		if (storage.userSettings.livePreviews) {
			storage.runtime.previewTick = ((storage.runtime.previewTick ?? 0) + 1) % 10;
		}

		// ----
		// delete streamers who are offline
		// -----

		const liveIds = new Set(liveStreams.map((s) => s.user_id));
		for (const streamerId of Object.keys(storage.runtime.previousStreams)) {
			if (!liveIds.has(streamerId)) {
				delete storage.runtime.previousStreams[streamerId];
			}
		}

		for (const streamer of liveStreams) {
			const previous = storage.runtime.previousStreams[streamer.user_id];
			const settings = getStreamerNotifications(storage.userSettings, streamer.user_id);

			await checkLiveNotification(streamer, previous, settings);
			await checkTitleNotification(streamer, previous, settings);
			await checkCategoryNotification(streamer, previous, settings);

			storage.runtime.previousStreams[streamer.user_id] = {
				title: streamer.title,
				category: streamer.game_name,
			};
		}

		await saveRuntime(storage.runtime);
	});

	async function sendNotification(stream: FollowData, title: string, message: string) {
		try {
			await browser.notifications.create(stream.user_login, {
				type: 'basic',
				iconUrl: browser.runtime.getURL(
					import.meta.env.COMMAND === 'serve' ? '/dev/icon128.png' : '/icon128.png'
				),
				title,
				message,
				// Firefox throws "Unexpected property" if these are present -
				// it doesn't support notification buttons/priority at all.
				...(import.meta.env.FIREFOX ? {} : { priority: 2, buttons: [{ title: 'Open Stream' }] }),
			});
		} catch (err) {
			console.error('Failed to send notification for', stream.user_name, err);
		}
	}

	async function updateBadge(count: number) {
		if (count === 0) {
			await setBadge('0', '#808080');
			return;
		}

		await setBadge(String(count), '#EB0400', 'white');
	}

	async function checkLiveNotification(
		stream: FollowData,
		previous: PreviousStream | undefined,
		settings: StreamerNotifications
	) {
		// Live notifications are disabled.
		if (!settings.live.enabled) return;

		// Stream was already live during the previous check.
		if (previous) return;

		// Stream just went live.
		await sendNotification(stream, `${stream.user_name} is LIVE 🔴`, stream.title);

		if (settings.live.autoOpen) {
			await browser.tabs.create({
				url: `https://twitch.tv/${stream.user_login}`,
			});
		}
	}
	async function checkTitleNotification(
		stream: FollowData,
		previous: PreviousStream | undefined,
		settings: StreamerNotifications
	) {
		if (!settings.titleChange.enabled) return;

		// No previous snapshot -> stream just started.
		if (!previous) return;

		// Title didn't change.
		if (previous.title === stream.title) return;

		await sendNotification(stream, `${stream.user_name} changed stream title ✏️`, stream.title);

		if (settings.titleChange.autoOpen) {
			await browser.tabs.create({
				url: `https://twitch.tv/${stream.user_login}`,
			});
		}
	}

	async function checkCategoryNotification(
		stream: FollowData,
		previous: PreviousStream | undefined,
		settings: StreamerNotifications
	) {
		// Category change notifications are disabled.
		if (!settings.categoryChange.enabled) return;

		// No previous snapshot means the stream has just started.
		// This is handled by checkLiveNotification().
		if (!previous) return;

		// Category hasn't changed.
		if (previous.category === stream.game_name) return;

		await sendNotification(
			stream,
			`${stream.user_name} changed category 🎮`,
			`Now playing: ${stream.game_name}`
		);

		if (settings.categoryChange.autoOpen) {
			await browser.tabs.create({
				url: `https://twitch.tv/${stream.user_login}`,
			});
		}
	}
});
