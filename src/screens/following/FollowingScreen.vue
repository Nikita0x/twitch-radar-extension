<template>
	<div
		class="following custom-scrollbar"
		ref="scrollContainer"
		@scroll="
			(event) => {
				const el = event.target as HTMLDivElement;
				navigationStore.saveScrollPosition('following', el.scrollTop);
			}
		"
	>
		<Transition name="fade" mode="out-in">
			<div v-if="localLoading" key="loading" class="results-section">
				<StreamerCardSkeleton v-for="n in 5" :key="n" />
			</div>
			<div v-else-if="error" key="error" class="error">
				<p>{{ error }}</p>
				<button @click="error = null" class="retry-btn">Try again</button>
			</div>

			<div v-else key="content">
				<div class="toolbar">
					<input
						ref="search-input"
						class="search-input"
						placeholder="Streamer name..."
						v-model="search"
					/>
				</div>

				<div v-if="search && filteredStreamers.length === 0" class="empty-search">
					<div class="icon">🔍</div>
					<h3>No streamer found</h3>
					<p>Try a different search term</p>
				</div>

				<div class="results-section">
					<StreamerCard
						v-for="(streamer, index) in filteredStreamers"
						:key="streamer.id"
						:streamer="streamer"
						:style="{ '--i': index }"
					/>
				</div>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, useTemplateRef, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useTwitchStore, type StreamersDetails } from '@/stores/twitch.store.ts';
import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { useNavigationStore } from '@/stores/navigation.store.ts';
import { hasActiveNotifications } from '@/utils/utils.ts';

import StreamerCard from '@/screens/following/components/StreamerCard.vue';
import StreamerCardSkeleton from '@/screens/following/components/StreamerCardSkeleton.vue';

const twitchStore = useTwitchStore();
const userSettingsStore = useUserSettingsStore();
const navigationStore = useNavigationStore();

const { loading, error, followedAllStreams, followedLiveStreams, isAuthenticated } =
	storeToRefs(twitchStore);
const { userSettingsState } = storeToRefs(userSettingsStore);
const { previousScreen } = storeToRefs(navigationStore);

const search = ref('');
const searchRef = useTemplateRef('search-input');
const scrollContainer = useTemplateRef('scrollContainer');

function getPriority(streamer: StreamersDetails) {
	const isLive = liveStreamerIds.value.has(streamer.id);
	const notificationsEnabled = hasActiveNotifications(userSettingsState.value, streamer.id);

	if (isLive && notificationsEnabled) return 0;
	if (isLive) return 1;
	if (notificationsEnabled) return 2;
	return 3;
}

/** Local loading — stays true until all data (including followedAllStreams) is loaded */
const localLoading = computed(
	() =>
		loading.value ||
		(isAuthenticated.value && followedAllStreams.value.length === 0 && !error.value)
);

const liveStreamerIds = computed(() => new Set(followedLiveStreams.value.map((s) => s.user_id)));

const filteredStreamers = computed(() => {
	let list = followedAllStreams.value;

	if (search.value) {
		const q = search.value.toLowerCase();
		list = list.filter(
			(s) => s.display_name.toLowerCase().includes(q) || s.login.toLowerCase().includes(q)
		);
	}

	return [...list].sort((a, b) => getPriority(a) - getPriority(b));
});

// The search input only exists once loading is done, so wait for it instead of
// onMounted. Scroll is restored only when returning from a streamer's settings.
watch(searchRef, async (input) => {
	if (!input) return;

	input.focus();
	await nextTick();

	scrollContainer.value?.scrollTo({
		top:
			previousScreen.value === 'streamer-settings'
				? navigationStore.getScrollPosition('following')
				: 0,
	});
});
</script>

<style scoped>
.following {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: var(--color-bg);
	overflow: auto;
}

.toolbar {
	display: flex;
	padding: 5px;
}

/* crossfade between loading/error/content states */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.error {
	padding: 10px;
	color: var(--color-error);
	font-size: 14px;
	background: var(--color-error-bg);
	border-radius: 6px;
}

.error p {
	margin: 0 0 8px 0;
	word-break: break-word;
}

.retry-btn {
	background-color: var(--color-accent);
	color: white;
	border: none;
	padding: 5px 15px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
}

.retry-btn:hover {
	background-color: var(--color-accent-hover);
}

.search-input {
	flex: 1;
	padding: 0 5px;
	height: 38px;
	border: 1px solid var(--color-border-input);
	border-radius: 8px;
	font-size: 13px;
	background: var(--color-bg-input);
	color: var(--color-text);
	transition:
		border-color 0.2s,
		box-shadow 0.2s,
		background 0.2s;
}

.search-input::placeholder {
	color: var(--color-text-dim);
}

.search-input:focus {
	outline: none;
	border-color: var(--color-accent);
	box-shadow: 0 0 0 3px rgba(145, 70, 255, 0.18);
}

.empty-search {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 180px;
	text-align: center;
	color: var(--color-text-muted);
}

.empty-search .icon {
	font-size: 40px;
	margin-bottom: 12px;
	opacity: 0.8;
}

.empty-search h3 {
	margin: 0;
	font-size: 18px;
}

.empty-search p {
	margin-top: 6px;
	font-size: 13px;
	color: var(--color-text-dim);
}
</style>
