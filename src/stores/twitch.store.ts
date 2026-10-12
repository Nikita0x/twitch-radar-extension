import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { extractTokenFromUrl } from '@/utils/utils';
import {
	getAuth,
	saveAuth,
	getRuntime,
	saveRuntime,
	type RuntimeState,
} from '@/services/storage.service';
import { setBadge } from '@/services/badge.service';
import {
	fetchLiveStreams,
	fetchStreamsByUserIds,
	fetchUsersByIds,
	fetchCurrentUser,
	fetchFollowedChannelsIds,
} from '@/services/twitch-api';
import { CLIENT_ID } from '@/constants';
import { performOAuth } from '@/services/auth.service';
import { syncSettings } from '@/services/cloudflare.service';
import { useUserSettingsStore } from './user-settings.store';
import type { User, Stream } from '@/services/twitch-api';
import type { StreamerId } from '@/stores/user-settings.store';

export const useTwitchStore = defineStore('twitch', () => {
	const accessToken = ref<string | null>(null);
	const user = ref<User | null>(null);
	const loading = ref(false);
	const error = ref<string | null>(null);
	const followedLiveStreams = ref<Stream[]>([]);
	const followedAllStreams = ref<User[]>([]);
	const trackedStreamers = ref<User[]>([]);

	const userSettingsStore = useUserSettingsStore();

	const isAuthenticated = computed(() => !!accessToken.value);

	// A tracked channel the user later followed on Twitch counts as followed only.
	const trackedOnlyIds = computed(() => {
		const followedIds = new Set(followedAllStreams.value.map((s) => s.id));
		return new Set(
			userSettingsStore.userSettingsState.trackedChannels.filter((id) => !followedIds.has(id))
		);
	});

	async function loginWithTwitch() {
		loading.value = true;
		error.value = null;
		try {
			const redirectUri = browser.identity.getRedirectURL();
			const authUrl =
				`https://id.twitch.tv/oauth2/authorize` +
				`?client_id=${CLIENT_ID}` +
				`&redirect_uri=${encodeURIComponent(redirectUri)}` +
				`&response_type=token` +
				`&scope=user:read:follows`;

			const oauthRedirectUrl = await performOAuth(authUrl);
			const token = extractTokenFromUrl(oauthRedirectUrl);
			if (!token) {
				throw new Error('Токен доступа не найден в URL редиректа');
			}

			accessToken.value = token;

			const getUserProfileResult = await fetchCurrentUser(token);

			if (!getUserProfileResult.ok) {
				console.error(getUserProfileResult.error);
				return getUserProfileResult;
			}

			user.value = getUserProfileResult.data;

			await saveAuth({
				accessToken: token,
				isAuthenticated: true,
				userId: user.value.id,
			});

			await syncSettings(token);
			await userSettingsStore.loadSettings();

			const fetchFollowedLiveStreamsResult = await fetchLiveStreams(
				token,
				user.value.id,
				userSettingsStore.userSettingsState.trackedChannels
			);

			if (!fetchFollowedLiveStreamsResult.ok) {
				console.error(fetchFollowedLiveStreamsResult.error);
				return fetchFollowedLiveStreamsResult;
			}

			followedLiveStreams.value = fetchFollowedLiveStreamsResult.data;
			await persistLiveStreams(followedLiveStreams.value);

			const idsResult = await fetchFollowedChannelsIds(token, user.value.id);

			if (!idsResult.ok) {
				console.error(idsResult.error);
				return idsResult;
			}

			const fetchUsersByIdsResult = await fetchUsersByIds(token, idsResult.data);

			if (!fetchUsersByIdsResult.ok) {
				console.error(fetchUsersByIdsResult.error);
				return fetchUsersByIdsResult;
			}

			followedAllStreams.value = fetchUsersByIdsResult.data;
			await loadTrackedStreamers(token);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('canceled') || message.includes('cancelled')) {
				console.log('Authorization declined by user.');
			} else {
				error.value = `Authorization error: ${message}`;
			}
		} finally {
			loading.value = false;
		}
	}

	async function logout() {
		await saveAuth({ accessToken: '', isAuthenticated: false, userId: '' });

		accessToken.value = null;
		user.value = null;
		followedLiveStreams.value = [];
		followedAllStreams.value = [];
		trackedStreamers.value = [];
		error.value = null;
		loading.value = false;
	}

	async function init() {
		listenStorageChanges();
		loading.value = true;
		try {
			const auth = await getAuth();

			if (auth.accessToken) {
				accessToken.value = auth.accessToken;

				const getUserProfileResult = await fetchCurrentUser(accessToken.value);

				if (!getUserProfileResult.ok) {
					console.error(getUserProfileResult.error);
					return getUserProfileResult;
				}

				user.value = getUserProfileResult.data;

				const fetchFollowedLiveStreamsResult = await fetchLiveStreams(
					accessToken.value,
					user.value.id,
					userSettingsStore.userSettingsState.trackedChannels
				);

				if (!fetchFollowedLiveStreamsResult.ok) {
					console.error(fetchFollowedLiveStreamsResult.error);
					return fetchFollowedLiveStreamsResult;
				}

				followedLiveStreams.value = fetchFollowedLiveStreamsResult.data;
				await persistLiveStreams(followedLiveStreams.value);

				const idsResult = await fetchFollowedChannelsIds(accessToken.value, user.value.id);

				if (!idsResult.ok) {
					console.error(idsResult.error);
					return idsResult;
				}

				const fetchUsersByIdsResult = await fetchUsersByIds(accessToken.value, idsResult.data);

				if (!fetchUsersByIdsResult.ok) {
					console.error(fetchUsersByIdsResult.error);
					return fetchUsersByIdsResult;
				}

				followedAllStreams.value = fetchUsersByIdsResult.data;
				await loadTrackedStreamers(accessToken.value);
			} else {
				accessToken.value = null;
				user.value = null;
				followedLiveStreams.value = [];
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			error.value = message;
		} finally {
			loading.value = false;
		}
	}

	async function loadTrackedStreamers(token: string) {
		const ids = userSettingsStore.userSettingsState.trackedChannels;

		if (ids.length === 0) {
			trackedStreamers.value = [];
			return;
		}

		const result = await fetchUsersByIds(token, ids);

		// Tracked channels are an extra — a failure here must not break the Following tab.
		if (result.ok) {
			trackedStreamers.value = result.data;
		}
	}

	async function trackChannel(streamerId: StreamerId) {
		if (!accessToken.value) return;

		const trackedChannels = userSettingsStore.userSettingsState.trackedChannels;
		if (trackedChannels.includes(streamerId)) return;

		const result = await fetchUsersByIds(accessToken.value, [streamerId]);
		if (!result.ok || !result.data[0]) return;

		trackedStreamers.value.push(result.data[0]);
		await userSettingsStore.updateSettings({ trackedChannels: [...trackedChannels, streamerId] });

		// Show it in Live right away instead of waiting up to 30s for the background poll.
		const streamResult = await fetchStreamsByUserIds(accessToken.value, [streamerId]);
		const stream = streamResult.ok ? streamResult.data[0] : undefined;
		if (stream && !followedLiveStreams.value.some((s) => s.user_id === streamerId)) {
			followedLiveStreams.value = [...followedLiveStreams.value, stream];
		}
	}

	async function untrackChannel(streamerId: string) {
		trackedStreamers.value = trackedStreamers.value.filter((s) => s.id !== streamerId);
		// Drop it from Live right away instead of waiting up to 30s for the next poll —
		// unless the user has since followed it on Twitch, then it stays live as followed.
		if (!followedAllStreams.value.some((s) => s.id === streamerId)) {
			followedLiveStreams.value = followedLiveStreams.value.filter((s) => s.user_id !== streamerId);
		}

		await userSettingsStore.updateSettings({
			trackedChannels: userSettingsStore.userSettingsState.trackedChannels.filter(
				(id) => id !== streamerId
			),
		});
	}

	async function persistLiveStreams(streams: Stream[]) {
		const runtime = await getRuntime();
		runtime.liveStreams = streams;
		await saveRuntime(runtime);
	}

	function listenStorageChanges() {
		browser.storage.onChanged.addListener((changes) => {
			const newRuntime = changes.runtime?.newValue as RuntimeState | undefined;
			if (Array.isArray(newRuntime?.liveStreams)) {
				followedLiveStreams.value = newRuntime.liveStreams;
			}
		});
	}

	watch(followedLiveStreams, async () => {
		if (!isAuthenticated.value) {
			await setBadge('!', '#808080');
		} else {
			await setBadge(String(followedLiveStreams.value.length), '#EB0400', 'white');
		}
	});

	return {
		accessToken,
		user,
		loading,
		error,
		followedLiveStreams,
		followedAllStreams,
		trackedStreamers,
		trackedOnlyIds,
		isAuthenticated,

		loginWithTwitch,
		logout,
		init,
		trackChannel,
		untrackChannel,
	};
});
