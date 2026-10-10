<template>
	<a
		:href="`https://twitch.tv/${props.stream.user_login}`"
		target="_blank"
		rel="noopener noreferrer"
		class="card"
		:title="props.stream.title"
	>
		<div class="thumb-wrap">
			<div v-if="!imageLoaded" class="thumb-skeleton"></div>

			<img
				:src="
					userSettingsState.livePreviews
						? getPreview(props.stream.user_login, storage.runtime.previewTick)
						: props.stream.thumbnail_url.replace('{width}', '200').replace('{height}', '100')
				"
				class="thumb"
				:class="{ loaded: imageLoaded }"
				width="200"
				height="100"
				@load="imageLoaded = true"
			/>

			<div class="thumb-overlay">
				<span class="live"></span>
				<span class="thumb-user">{{ props.stream.user_name }}</span>
			</div>
		</div>

		<div class="card-info">
			<div>
				<p class="card-name">{{ props.stream.title }}</p>
				<p class="card-game">{{ props.stream.game_name || '—' }}</p>
			</div>
			<div class="meta-row">
				<div style="display: flex; align-items: center; gap: 5px">
					<!-- <span class="live"></span> -->
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						aria-hidden="true"
						style="fill: var(--color-red)"
					>
						<path
							fill-rule="evenodd"
							d="M6 8a6 6 0 1 1 7.025 5.913l.012.036A3 3 0 0 0 15.883 16H17a4 4 0 0 1 4 4v2h-2v-2a2 2 0 0 0-2-2h-1.117A5 5 0 0 1 12 16.15 5 5 0 0 1 8.117 18H7a2 2 0 0 0-2 2v2H3v-2a4 4 0 0 1 4-4h1.117a3 3 0 0 0 2.846-2.051l.012-.036A6.002 6.002 0 0 1 6 8Zm6 4a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
							clip-rule="evenodd"
						></path>
					</svg>
					<AnimatedViewCount :count="props.stream.viewer_count" />
				</div>

				<span class="uptime">
					<span
						v-if="isNew"
						class="new-badge"
						:title="`Went live less than ${NEW_STREAM_THRESHOLD_MINUTES} minutes ago`"
						>New</span
					>
					<!-- <span style="transform: translateY(1px); display: inline-block">🕒</span> -->
					{{ formatUptime(props.stream.started_at) }}</span
				>
			</div>
		</div>
	</a>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FollowData } from '@/stores/twitch.store';
import { formatUptime, getPreview, isNewStream } from '@/utils/utils';
import { NEW_STREAM_THRESHOLD_MINUTES } from '@/constants';
import AnimatedViewCount from '@/components/AnimatedViewCount.vue';
import { storeToRefs } from 'pinia';

import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { useStorageStore } from '@/stores/storage.store.ts';

interface Props {
	stream: FollowData;
}

const props = defineProps<Props>();

const userSettingsStore = useUserSettingsStore();
const storageStore = useStorageStore();

const { userSettingsState } = storeToRefs(userSettingsStore);
const { storage } = storeToRefs(storageStore);

const imageLoaded = ref(false);
const isNew = computed(() => isNewStream(props.stream.started_at));

watch(
	() => storage.value.runtime.previewTick,
	() => {
		imageLoaded.value = false;
	}
);
</script>

<style scoped>
.card {
	display: flex;

	gap: 10px;
	border-bottom: 1px solid var(--color-border);
	color: inherit;
	text-decoration: none;
	cursor: pointer;
	padding: 5px;
	transition: all 0.2s ease;
}

.card:hover {
	background: var(--color-bg-secondary);

	transform: translateY(-1px);
	box-shadow: 0 2px 8px rgba(145, 70, 255, 0.12);
}

.card:last-child {
	border-bottom: none;
}

.thumb-wrap {
	position: relative;
	flex-shrink: 0;
	overflow: hidden;
}

.thumb {
	display: block;
	width: 200px;
	height: 100px;
	object-fit: cover;

	opacity: 0;
	transform: translateY(14px) scale(0.96);
	filter: blur(6px);

	transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.thumb.loaded {
	opacity: 1;
	transform: scale(1);
	filter: blur(0);
}

.thumb-overlay {
	position: absolute;
	left: 0;
	bottom: 0;

	display: flex;
	align-items: center;
	gap: 5px;

	padding: 7px 9px;

	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(12px);

	animation: card-content-in 0.35s ease both;
	animation-delay: calc(min(var(--i, 0), 8) * 40ms);
}
.thumb-user {
	color: white;
	font-size: 15px;
	letter-spacing: 0.02em;
	display: block;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.card-info {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 10px;
	font-size: 12px;
	flex: 1;

	animation: card-content-in 0.35s ease both;
	animation-delay: calc(min(var(--i, 0), 8) * 40ms);
}

.card-name {
	font-weight: bold;
	color: var(--color-text);
	overflow: hidden;
	font-size: 15px;

	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow-wrap: anywhere;
}

.card-game {
	color: var(--color-text-dim);
	font-size: 14px;
}

.meta-row {
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 13px;
	justify-content: space-between;
}

.live {
	display: inline-block;
	width: 1em;
	height: 1em;
	border-radius: 50%;
	background-color: var(--color-red);
}

.viewer-count {
	font-weight: 700;
	color: var(--color-text);
}

.uptime {
	display: flex;
	align-items: center;
	gap: 6px;
	color: var(--color-text);
}

.new-badge {
	font-size: 10px;
	font-weight: 700;
	padding: 2px 6px;
	border-radius: 4px;
	text-transform: uppercase;
	background: var(--color-red);
	color: white;
	cursor: help;
}

.thumb-skeleton {
	position: absolute;
	inset: 0;

	background: linear-gradient(
		90deg,
		var(--color-bg-secondary) 25%,
		var(--color-border) 50%,
		var(--color-bg-secondary) 75%
	);

	background-size: 200% 100%;

	animation: skeleton-loading 1.2s infinite;
}

@keyframes skeleton-loading {
	from {
		background-position: 200% 0;
	}

	to {
		background-position: -200% 0;
	}
}

@keyframes card-content-in {
	from {
		opacity: 0;
		transform: translateY(6px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
