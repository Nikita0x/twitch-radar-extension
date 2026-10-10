<template>
	<div class="main-container">
		<HeaderComponent />

		<Transition name="screen" mode="out-in">
			<component :is="currentPage" />
		</Transition>
	</div>
</template>

<script setup lang="ts">
import HeaderComponent from '@/components/HeaderComponent.vue';
import ChangelogScreen from '@/screens/changelog/ChangelogScreen.vue';
import FavoritesScreen from '@/screens/favorites/FavoritesScreen.vue';
import FollowingScreen from '@/screens/following/FollowingScreen.vue';
import SettingsScreen from '@/screens/settings/SettingsScreen.vue';
import StreamerSettingsScreen from '@/screens/streamer-settings/StreamerSettingsScreen.vue';
import TestingScreen from '@/screens/testing/TestingScreen.vue';
import { computed, onMounted } from 'vue';

import { useTwitchStore } from '@/stores/twitch.store.ts';
import { useNavigationStore } from '@/stores/navigation.store.ts';
import { useStorageStore } from '@/stores/storage.store.ts';
import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { useChangelogStore } from '@/stores/changelog.store.ts';

import type { Component } from 'vue';
import type { Screen } from '@/stores/navigation.store.ts';

import { storeToRefs } from 'pinia';

const twitchStore = useTwitchStore();
const userSettingsStore = useUserSettingsStore();
const navigationStore = useNavigationStore();
const storageStore = useStorageStore();
const changelogStore = useChangelogStore();
const { followedLiveStreams, isAuthenticated } = storeToRefs(twitchStore);
const { currentScreen } = storeToRefs(navigationStore);
const { userSettingsState } = storeToRefs(userSettingsStore);

onMounted(async () => {
	await changelogStore.load();
	await userSettingsStore.loadSettings();
	userSettingsStore.applyTheme(userSettingsState.value.theme);
	await twitchStore.init();
	await storageStore.load();
});

const screens: Record<Screen, Component> = {
	changelog: ChangelogScreen,
	'streamer-settings': StreamerSettingsScreen,
	favorites: FavoritesScreen,
	following: FollowingScreen,
	settings: SettingsScreen,
	testing: TestingScreen,
};

const currentPage = computed(() => screens[currentScreen.value]);
</script>

<style scoped>
.main-container {
	display: flex;
	flex-direction: column;
	height: 600px;
	width: 500px;
	background: var(--color-bg);
}

.screen-enter-active,
.screen-leave-active {
	transition:
		opacity 220ms ease-in-out,
		transform 220ms ease-in-out;
}

.screen-enter-from {
	opacity: 0;
	transform: translateX(12px);
}

.screen-leave-to {
	opacity: 0;
	transform: translateX(-12px);
}
</style>
