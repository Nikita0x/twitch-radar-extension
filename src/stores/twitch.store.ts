import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { extractTokenFromUrl } from '@/utils/utils';
import { getAuth, saveAuth, getRuntime, saveRuntime, type RuntimeState } from '@/services/storage.service';
import { setBadge } from '@/services/badge.service';
import { fetchFollowedLiveStreams } from '@/services/twitch-api';
import { CLIENT_ID } from '@/constants';
import { request, type Result, ok, err } from '@/types/result';
import { performOAuth } from '@/services/auth.service';
import { syncSettings } from '@/services/cloudflare.service';
import { useUserSettingsStore } from './user-settings.store';

interface TwitchUser {
    id: string;
    created_at: string;
    display_name: string;
    description: string;
    broadcaster_type: string;
    profile_image_url: string;
    offline_image_url: string;
    type: string;
    login: string;
    view_count: number;
}

export interface FollowData {
    game_id: string;
    game_name: string;
    id: string;
    is_mature: boolean;
    language: string;
    started_at: string;
    tag_ids: [];
    tags: string[];
    thumbnail_url: string;
    title: string;
    type: string;
    user_id: string;
    user_login: string;
    user_name: string;
    viewer_count: number;
}

export interface StreamersDetails {
    broadcaster_type: string;
    created_at: string;
    description: string;
    display_name: string;
    id: string;
    login: string;
    offline_image_url: string;
    profile_image_url: string;
    type: string;
    view_count: number;
}

export const useTwitchStore = defineStore('twitch', () => {
    const accessToken = ref<string | null>(null);
    const user = ref<TwitchUser | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const followedLiveStreams = ref<FollowData[]>([]);
    const followedAllStreams = ref<StreamersDetails[]>([]);

    const userSettinsStore = useUserSettingsStore();

    const isAuthenticated = computed(() => !!accessToken.value);

    async function fetchUserProfile(token: string): Promise<Result<TwitchUser>> {
        const result = await request<{ data: TwitchUser[] }>('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${token}`,
            },
        });

        if (!result.ok) {
            console.error(result.error.status);
            return err(result.error);
        }

        const user = result.data.data[0];
        if (!user) {
            return { ok: false, error: { status: 0, message: 'User not found' } };
        }

        return ok(user);
    }

    async function fetchAllFollowedChannelsIds(token: string): Promise<Result<string[]>> {
        error.value = null;

        if (!user.value) {
            const getUserProfileResult = await fetchUserProfile(token);

            if (!getUserProfileResult.ok) {
                console.error(getUserProfileResult.error);
                return getUserProfileResult;
            }

            user.value = getUserProfileResult.data;
        }

        const allIds: string[] = [];
        let cursor: string | undefined;

        do {
            const url = new URL('https://api.twitch.tv/helix/channels/followed');
            url.searchParams.set('user_id', user.value.id);
            url.searchParams.set('first', '100');
            if (cursor) {
                url.searchParams.set('after', cursor);
            }

            const result = await request<{
                data: {
                    broadcaster_id: string;
                    broadcaster_login: string;
                    broadcaster_name: string;
                    followed_at: string;
                }[];
                pagination: {
                    cursor: string;
                };
                total: number;
            }>(url.toString(), {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!result.ok) {
                console.error(result.error);
                return result;
            }

            allIds.push(...result.data.data.map((item) => item.broadcaster_id));
            cursor = result.data.pagination.cursor;
        } while (cursor);

        return ok(allIds);
    }

    async function fetchDetailsAboutStreamers(
        token: string,
        ids: string[]
    ): Promise<Result<StreamersDetails[]>> {
        error.value = null;

        const allDetails: StreamersDetails[] = [];

        for (let i = 0; i < ids.length; i += 100) {
            const batch = ids.slice(i, i + 100);
            const query = batch.map((id) => `id=${id}`).join('&');

            const result = await request<{ data: StreamersDetails[] }>(
                `https://api.twitch.tv/helix/users?${query}`,
                {
                    headers: {
                        'Client-ID': CLIENT_ID,
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!result.ok) {
                console.error(result.error);
                return result;
            }

            allDetails.push(...result.data.data);
        }

        return ok(allDetails);
    }

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

            const getUserProfileResult = await fetchUserProfile(token);

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

            await syncSettings(user.value.id);
            await userSettinsStore.loadSettings()

            const fetchFollowedLiveStreamsResult = await fetchFollowedLiveStreams(token, user.value.id);

            if (!fetchFollowedLiveStreamsResult.ok) {
                console.error(fetchFollowedLiveStreamsResult.error);
                return fetchFollowedLiveStreamsResult;
            }

            followedLiveStreams.value = fetchFollowedLiveStreamsResult.data;
            await persistLiveStreams(followedLiveStreams.value);

            const idsResult = await fetchAllFollowedChannelsIds(token);

            if (!idsResult.ok) {
                console.error(idsResult.error);
                return idsResult;
            }

            const fetchDetailsAboutStreamersResult = await fetchDetailsAboutStreamers(
                token,
                idsResult.data
            );

            if (!fetchDetailsAboutStreamersResult.ok) {
                console.error(fetchDetailsAboutStreamersResult.error);
                return fetchDetailsAboutStreamersResult;
            }

            followedAllStreams.value = fetchDetailsAboutStreamersResult.data;
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

                const getUserProfileResult = await fetchUserProfile(accessToken.value);

                if (!getUserProfileResult.ok) {
                    console.error(getUserProfileResult.error);
                    return getUserProfileResult;
                }

                user.value = getUserProfileResult.data;

                const fetchFollowedLiveStreamsResult = await fetchFollowedLiveStreams(
                    accessToken.value,
                    user.value.id
                );

                if (!fetchFollowedLiveStreamsResult.ok) {
                    console.error(fetchFollowedLiveStreamsResult.error);
                    return fetchFollowedLiveStreamsResult;
                }

                followedLiveStreams.value = fetchFollowedLiveStreamsResult.data;
                await persistLiveStreams(followedLiveStreams.value);

                const idsResult = await fetchAllFollowedChannelsIds(accessToken.value);

                if (!idsResult.ok) {
                    console.error(idsResult.error);
                    return idsResult;
                }

                const getDetailsAboutStreamersResult = await fetchDetailsAboutStreamers(
                    accessToken.value,
                    idsResult.data
                );

                if (!getDetailsAboutStreamersResult.ok) {
                    console.error(getDetailsAboutStreamersResult.error);
                    return getDetailsAboutStreamersResult;
                }

                followedAllStreams.value = getDetailsAboutStreamersResult.data;
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

    async function persistLiveStreams(streams: FollowData[]) {
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
        isAuthenticated,

        loginWithTwitch,
        logout,
        init,
        fetchAllFollowedChannelsIds,
        fetchDetailsAboutStreamers,
    };
});
