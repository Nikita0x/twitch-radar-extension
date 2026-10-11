<template>
	<section v-if="query.trim().length >= MIN_QUERY_LENGTH" class="channel-search">
		<h4 class="section-title">All of Twitch</h4>

		<div v-if="loading" class="rows">
			<div v-for="n in 3" :key="n" class="row" aria-hidden="true">
				<SkeletonBlock width="36px" height="36px" radius="50%" />
				<div class="info">
					<SkeletonBlock height="14px" width="110px" />
				</div>
				<SkeletonBlock width="72px" height="26px" radius="6px" />
			</div>
		</div>
		<p v-else-if="failed" class="hint">Couldn't search Twitch. Try again in a moment.</p>
		<p v-else-if="results.length === 0" class="hint">No channels found on Twitch</p>

		<div v-else class="rows">
			<div v-for="channel in results" :key="channel.id" class="row">
				<img :src="channel.thumbnail_url" :alt="channel.display_name" class="avatar" />
				<div class="info">
					<span class="name">{{ channel.display_name }}</span>
					<span v-if="channel.is_live" class="live">● LIVE · {{ channel.game_name }}</span>
				</div>

				<span v-if="followedIds.has(channel.id)" class="state">Following</span>
				<button
					v-else-if="trackedIds.has(channel.id)"
					class="track-btn tracking"
					:disabled="pendingId === channel.id"
					title="Stop tracking"
					@click="toggleTracking(channel.id)"
				>
					✓ Tracking
				</button>
				<button
					v-else
					class="track-btn"
					:disabled="pendingId === channel.id"
					title="Get live status and notifications without following on Twitch"
					@click="toggleTracking(channel.id)"
				>
					👁 Track
				</button>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useTwitchStore } from '@/stores/twitch.store.ts';
import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { searchChannels, type SearchedChannel } from '@/services/twitch-api';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

const props = defineProps<{ query: string }>();

const twitchStore = useTwitchStore();
const { accessToken, followedAllStreams } = storeToRefs(twitchStore);
const { userSettingsState } = storeToRefs(useUserSettingsStore());

const results = ref<SearchedChannel[]>([]);
const loading = ref(false);
const failed = ref(false);
const pendingId = ref<string | null>(null);

const followedIds = computed(() => new Set(followedAllStreams.value.map((s) => s.id)));
const trackedIds = computed(() => new Set(userSettingsState.value.trackedChannels));

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
// Responses can arrive out of order ("za" after "zack"); only the latest one may win.
let latestRequestId = 0;

watch(
	() => props.query.trim(),
	(query) => {
		clearTimeout(debounceTimer);
		latestRequestId++;

		if (query.length < MIN_QUERY_LENGTH || !accessToken.value) {
			loading.value = false;
			results.value = [];
			return;
		}

		loading.value = true;
		failed.value = false;
		debounceTimer = setTimeout(() => runSearch(query), SEARCH_DEBOUNCE_MS);
	},
	{ immediate: true }
);

async function runSearch(query: string) {
	const requestId = ++latestRequestId;
	const result = await searchChannels(accessToken.value!, query);

	if (requestId !== latestRequestId) return;

	loading.value = false;
	failed.value = !result.ok;
	results.value = result.ok ? result.data : [];
}

async function toggleTracking(channelId: string) {
	pendingId.value = channelId;
	try {
		if (trackedIds.value.has(channelId)) {
			await twitchStore.untrackChannel(channelId);
		} else {
			await twitchStore.trackChannel(channelId);
		}
	} finally {
		pendingId.value = null;
	}
}
</script>

<style scoped>
.channel-search {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 8px 5px 12px;
	border-top: 1px solid var(--color-border);
}

.section-title {
	margin: 0;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: var(--color-text-dim);
}

.rows {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.row {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 6px;
	border-radius: 8px;
	transition: background 0.2s ease;

	&:hover {
		background: var(--color-bg-secondary);
	}
}

.avatar {
	width: 36px;
	height: 36px;
	flex-shrink: 0;
	border-radius: 50%;
	object-fit: cover;
}

.info {
	display: flex;
	flex-direction: column;
	min-width: 0;
	flex: 1;
}

.name {
	font-size: 14px;
	font-weight: 600;
	color: var(--color-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.live {
	font-size: 11px;
	color: var(--color-red);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.state {
	font-size: 12px;
	color: var(--color-text-dim);
}

.track-btn {
	flex-shrink: 0;
	padding: 5px 10px;
	border: 1px solid var(--color-accent);
	border-radius: 6px;
	background: var(--color-accent);
	color: white;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 0.2s,
		opacity 0.2s;

	&:hover {
		background: var(--color-accent-hover);
	}

	&:disabled {
		opacity: 0.6;
		cursor: default;
	}
}

.track-btn.tracking {
	background: transparent;
	color: var(--color-accent);

	&:hover {
		background: var(--color-bg-secondary);
	}
}

.hint {
	margin: 0;
	padding: 6px;
	font-size: 13px;
	color: var(--color-text-dim);
}
</style>
