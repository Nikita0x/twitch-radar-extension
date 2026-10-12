import type { StreamerNotifications, UserSettings } from '@/services/storage.service';
import { DEFAULT_USER_SETTINGS, getUserSettings, saveUserSettings } from '@/services/storage.service';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type StreamerId = string;

export const useUserSettingsStore = defineStore('user-settings', () => {
    const userSettingsState = ref<UserSettings>({ ...DEFAULT_USER_SETTINGS });

    async function loadSettings() {
        const settings = await getUserSettings();
        userSettingsState.value = settings;
    }

    async function updateSettings(partialSettings: Partial<UserSettings>) {
        Object.assign(userSettingsState.value, partialSettings);

        await saveUserSettings(userSettingsState.value);
    }

    async function updateStreamerNotifications(
        streamerId: StreamerId,
        streamerNotifications: StreamerNotifications
    ) {
        userSettingsState.value.notifications[streamerId] = streamerNotifications;

        await saveUserSettings(userSettingsState.value);
    }

    async function toggleTheme() {
        const newTheme = userSettingsState.value.theme === 'dark' ? 'light' : 'dark';
        userSettingsState.value.theme = newTheme;
        await updateSettings({ theme: newTheme });
    }

    async function toggleLivePreviews() {
        userSettingsState.value.livePreviews = !userSettingsState.value.livePreviews;
        await updateSettings({ livePreviews: userSettingsState.value.livePreviews });
    }



    watch(() => userSettingsState.value.theme, (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
    },
)

    return {
        userSettingsState,
        updateSettings,
        loadSettings,
        updateStreamerNotifications,
        toggleTheme,
        toggleLivePreviews,
    };
});
