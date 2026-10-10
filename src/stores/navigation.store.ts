import type { StreamersDetails } from '@/stores/twitch.store';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type Tab = 'favorites' | 'following';
export type Screen = Tab | 'settings' | 'streamer-settings' | 'changelog' | 'testing';

export const useNavigationStore = defineStore('navigation', () => {
	const stack = ref<Screen[]>(['favorites']);
	const previousScreen = ref<Screen | null>(null);
	const scrollPositions = ref<Partial<Record<Screen, number>>>({});

	const selectedStreamer = ref<StreamersDetails | null>(null);

	const currentScreen = computed(() => stack.value[stack.value.length - 1]!);
	const activeTab = computed(() => stack.value[0] as Tab);
	const canGoBack = computed(() => stack.value.length > 1);

	function switchTab(tab: Tab) {
		if (stack.value.length === 1 && activeTab.value === tab) return;

		previousScreen.value = currentScreen.value;
		stack.value = [tab];
	}

	function navigateTo(screen: Screen) {
		if (screen === currentScreen.value) return;

		previousScreen.value = currentScreen.value;
		stack.value.push(screen);
	}

	function back() {
		if (!canGoBack.value) return;

		previousScreen.value = currentScreen.value;
		stack.value.pop();
	}

	function saveScrollPosition(screen: Screen, scrollTop: number) {
		scrollPositions.value[screen] = scrollTop;
	}

	function getScrollPosition(screen: Screen) {
		return scrollPositions.value[screen] ?? 0;
	}

	return {
		selectedStreamer,
		currentScreen,
		previousScreen,
		activeTab,
		canGoBack,
		switchTab,
		navigateTo,
		back,
		saveScrollPosition,
		getScrollPosition,
	};
});
