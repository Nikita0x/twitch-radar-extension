<template>
	<div
		class="twitch-auth custom-scrollbar"
		ref="scrollContainer"
		@scroll="
			(event) => {
				const el = event.target as HTMLDivElement;
				navigationStore.saveScrollPosition('settings', el.scrollTop);
			}
		"
	>
		<!-- Theme toggle -->
		<div v-if="isAuthenticated" class="setting-row">
			<label class="toggle-label">
				<input
					type="checkbox"
					:checked="userSettingsState.theme === 'dark'"
					@change="userSettingsStore.toggleTheme()"
				/>
				Dark theme
			</label>
		</div>

		<div class="setting-row">
			<label class="toggle-label">
				<input
					type="checkbox"
					:checked="userSettingsState.livePreviews"
					@change="userSettingsStore.toggleLivePreviews"
				/>
				Live Previews (experimental)
			</label>

			<div
				style="cursor: help"
				title="Automatically refreshes stream preview thumbnails every 30 seconds while the popup is open.
                
Experimental feature. May stop working if Twitch changes how preview images are cached."
			>
				<svg
					class="info-icon"
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16.93 16.93"
				>
					<path
						d="M8.51 0C3.83-.02.02 3.75 0 8.42c-.02 4.68 3.75 8.49 8.42 8.51 4.68.02 8.49-3.75 8.51-8.42C16.96 3.83 13.18.02 8.51 0m-.12 2.28c.41 0 .75.15 1.03.44.29.28.43.63.43 1.04s-.14.75-.43 1.04c-.28.28-.63.42-1.03.42-.42 0-.76-.14-1.05-.42-.28-.28-.43-.63-.43-1.04 0-.42.15-.76.44-1.04.28-.29.63-.44 1.04-.44M6 6.07h3.89v7.25h1.17v.93H6v-.93h1.16V7H6Z"
					/>
				</svg>
			</div>
		</div>

		<Transition name="fade" mode="out-in">
			<div v-if="localLoading" key="loading" class="results-section">
				<StreamerCardSkeleton v-for="n in 5" :key="n" />
			</div>
			<div v-else-if="error" key="error" class="error">
				<p>{{ error }}</p>
				<button @click="error = null" class="retry-btn">Try again</button>
			</div>

			<div v-else key="content" class="followed-section">
				<h3 class="section-title">Followed Streamers ({{ followedAllStreams.length }})</h3>
				<input
					ref="search-input"
					class="search-input"
					placeholder="Streamer name..."
					v-model="search"
				/>

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
import { ref, computed, onMounted, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useTwitchStore, type StreamersDetails } from '@/stores/twitch.store.ts';
import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { useNavigationStore } from '@/stores/navigation.store.ts';
import { hasActiveNotifications } from '@/utils/utils.ts';

import StreamerCard from '@/screens/settings/components/StreamerCard.vue';
import StreamerCardSkeleton from '@/screens/settings/components/StreamerCardSkeleton.vue';

const twitchStore = useTwitchStore();
const userSettingsStore = useUserSettingsStore();
const navigationStore = useNavigationStore();

const { user, loading, error, followedAllStreams, followedLiveStreams, isAuthenticated } =
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

/** Set of live streamer IDs for O(1) lookup */
const liveStreamerIds = computed(() => new Set(followedLiveStreams.value.map((s) => s.user_id)));

const filteredStreamers = computed(() => {
	// Берём ВСЕХ фолловеров (и онлайн, и оффлайн)
	let list = followedAllStreams.value;

	// Если пользователь что-то ввёл в поиск — фильтруем по имени
	if (search.value) {
		const q = search.value.toLowerCase();
		list = list.filter(
			(s) => s.display_name.toLowerCase().includes(q) || s.login.toLowerCase().includes(q)
		);
	}

	return [...list].sort((a, b) => {
		return getPriority(a) - getPriority(b);
	});
});

onMounted(() => {
	if (!searchRef.value) return;

	searchRef.value.focus();

	if (!scrollContainer.value) return;

	if (previousScreen.value === 'favorites') {
		scrollContainer.value.scrollTo({
			top: 0,
		});
	} else {
		scrollContainer.value.scrollTo({
			top: navigationStore.getScrollPosition('settings'),
		});
	}
});
</script>

<style scoped>
.twitch-auth {
	display: flex;
	flex-direction: column;
	height: 100%;

	background: var(--color-bg);
	overflow: auto;
}

.setting-row {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 5px;
	text-align: left;
}

.info-icon {
	fill: var(--color-text);
}

.toggle-label {
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	font-size: 14px;
	user-select: none;
	color: var(--color-text);
}

.toggle-label input[type='checkbox'] {
	width: 16px;
	height: 16px;
	cursor: pointer;
	accent-color: var(--color-accent);
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

.followed-section {
	border-top: 1px solid var(--color-border);
	padding-top: 12px;
}

.section-title {
	font-size: 14px;
	font-weight: 700;
	color: var(--color-text);
	text-align: left;
	padding: 0 5px;
}

.search-input {
	padding: 0 5px;
	margin-inline: 5px;
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
	width: 98%;
	margin-bottom: 10px;
}

.search-input::placeholder {
	color: var(--color-text-dim);
}

.search-input:focus {
	outline: none;
	border-color: var(--color-accent);
	box-shadow: 0 0 0 3px rgba(145, 70, 255, 0.18);
}

.results-inner {
	display: flex;
	flex-direction: column;
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
