<template>
	<div class="state-shell custom-scrollbar">
		<div
			v-if="isAuthenticated && currentScreen === 'favorites'"
			style="display: flex; padding-inline: 5px"
			class="toolbar"
		>
			<input
				class="search-input"
				ref="search-input"
				placeholder="Streamer name..."
				v-model="search"
			/>
			<div>
				<select
					class="sort-select"
					name="sort"
					id="pet-select"
					v-model="userSettingsState.sort"
					@change="userSettingsStore.updateSettings({ sort: userSettingsState.sort })"
				>
					<option value="viewers:highToLow">Viewers: High to Low</option>
					<option value="viewers:lowToHigh">Viewers: Low to High</option>
					<option value="duration:longest">Duration: Longest</option>
					<option value="duration:shortest">Duration: Shortest</option>
				</select>
			</div>
		</div>

		<Transition name="fade" mode="out-in">
			<AppLoader v-if="loading && !isAuthenticated" key="loading-auth">
				Signing in with Twitch...
			</AppLoader>
			<div v-else-if="loading" key="loading-skeleton" class="results-section">
				<StreamCardSkeleton v-for="n in 5" :key="n" />
			</div>
			<AuthPrompt v-else-if="!isAuthenticated" key="auth-prompt" />
			<div v-else-if="error" key="error" class="api-error">{{ error }}</div>
			<div v-else-if="followedLiveStreams.length === 0" key="empty" class="empty-state">
				No active streams
			</div>
			<div v-else-if="visibleStreams.length === 0" key="empty-search" class="empty-search">
				<div class="icon">🔍</div>
				<h3>No streamer found</h3>
				<p>Try a different search term</p>
			</div>
			<TransitionGroup v-else key="list" tag="div" name="streams" class="results-section">
				<StreamCard
					v-for="(channel, index) in visibleStreams"
					:key="channel.id"
					:stream="channel"
					:style="{ '--i': index }"
				/>
			</TransitionGroup>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import StreamCard from '@/screens/favorites/components/StreamCard.vue';
import StreamCardSkeleton from '@/screens/favorites/components/StreamCardSkeleton.vue';
import AppLoader from '@/screens/favorites/components/AppLoader.vue';
import AuthPrompt from '@/screens/favorites/components/AuthPrompt.vue';
import { useTwitchStore } from '@/stores/twitch.store.ts';
import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { useNavigationStore } from '@/stores/navigation.store.ts';

// interface Props {
// 	search: string;
// }
// const props = defineProps<Props>();

const twitchStore = useTwitchStore();
const userSettingsStore = useUserSettingsStore();
const navigationStore = useNavigationStore();
const { loading, error, followedLiveStreams, isAuthenticated } = storeToRefs(twitchStore);
const { userSettingsState } = storeToRefs(userSettingsStore);
const { currentScreen } = storeToRefs(navigationStore);

const search = ref('');
const inputRef = useTemplateRef('search-input');

const getTime = (date: string) => new Date(date).getTime();

const sortedStreams = computed(() => {
	const result = Array.isArray(followedLiveStreams.value) ? [...followedLiveStreams.value] : [];

	switch (userSettingsState.value.sort) {
		case 'viewers:highToLow':
			result.sort((a, b) => b.viewer_count - a.viewer_count);
			break;

		case 'viewers:lowToHigh':
			result.sort((a, b) => a.viewer_count - b.viewer_count);
			break;

		case 'duration:longest':
			result.sort((a, b) => getTime(a.started_at) - getTime(b.started_at));
			break;

		case 'duration:shortest':
			result.sort((a, b) => getTime(b.started_at) - getTime(a.started_at));
			break;
	}

	return result;
});

const visibleStreams = computed(() => {
	const query = search.value.trim().toLowerCase();

	if (!query) {
		return sortedStreams.value;
	}

	return sortedStreams.value.filter((stream) => stream.user_name.toLowerCase().includes(query));
});

watch(inputRef, (input) => {
	input?.focus();
});
</script>

<style scoped>
.api-error {
	padding: 8px;
	color: var(--color-error);
	font-size: 13px;
	background: var(--color-error-bg);
	border-radius: 6px;
	margin-top: 8px;
	text-align: center;
}

.state-shell {
	display: flex;
	flex-direction: column;
	/* background: red; */
	height: 100%;

	min-height: 120px;
	position: relative;
	overflow: auto;

}

.empty-state {
	padding: 15px;
	color: var(--color-text-muted);
	text-align: center;
	font-size: 13px;
	min-height: 90px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	gap: 8px;
}

.results-section {
	display: flex;
	flex-direction: column;
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

.toolbar {
	display: flex;
	gap: 5px;
	padding-block: 5px;
	align-items: center;
}

.search-input,
.sort-select {
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

.search-input {
	flex: 1;
	padding: 0 5px;
}

.search-input::placeholder {
	color: var(--color-text-dim);
}

.search-input:focus,
.sort-select:focus {
	outline: none;

	border-color: var(--color-accent);

	box-shadow: 0 0 0 3px rgba(145, 70, 255, 0.18);
}

.sort-select {
	min-width: 180px;

	cursor: pointer;
}

/* crossfade between loading/auth/error/empty/list states */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

/* animations for filtering */
.streams-enter-active,
.streams-leave-active {
	transition:
		opacity 250ms ease,
		transform 250ms ease;

	will-change: opacity, transform;
}

.streams-enter-from {
	opacity: 0;
	transform: translateY(10px);
}

.streams-leave-to {
	opacity: 0;
	transform: translateX(-20px);
}

.streams-leave-active {
	position: absolute;
	pointer-events: none;
}

.streams-move {
	transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
	will-change: transform;
}
</style>
