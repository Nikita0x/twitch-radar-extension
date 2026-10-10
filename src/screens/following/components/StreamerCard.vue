<template>
	<div class="streamer-card">
		<div class="card-header">
			<div style="display: flex; gap: 12px">
				<div class="avatar-wrap">
					<div class="avatar-skeleton" :class="{ hidden: avatarLoaded }"></div>
					<img
						:src="props.streamer.profile_image_url"
						:alt="props.streamer.display_name"
						class="avatar"
						:class="{ loaded: avatarLoaded }"
						width="60"
						height="60"
						@load="avatarLoaded = true"
					/>
					<span v-if="isLive" class="live-badge">LIVE</span>
				</div>
				<div class="header-info">
					<h3 class="display-name">{{ props.streamer.display_name }}</h3>
					<span class="login">@{{ props.streamer.login }}</span>
					<StreamerTypeBadge :type="props.streamer.broadcaster_type" />
				</div>
			</div>

			<div class="buttons">
				<button
					class="notif-toggle"
					:class="{ active: hasNotificationsEnabled }"
					@click="openStreamerSettings(streamer)"
					:title="`Open notification settings for ${streamer.display_name}`"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="currentColor"
						xmlns="http://www.w3.org/2000/svg"
						class="cog-icon"
					>
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M6.50001 0H9.50001L10.0939 2.37548C10.7276 2.6115 11.3107 2.95155 11.8223 3.37488L14.1782 2.70096L15.6782 5.29904L13.9173 7.00166C13.9717 7.32634 14 7.65987 14 8C14 8.34013 13.9717 8.67366 13.9173 8.99834L15.6782 10.701L14.1782 13.299L11.8223 12.6251C11.3107 13.0484 10.7276 13.3885 10.0939 13.6245L9.50001 16H6.50001L5.90614 13.6245C5.27242 13.3885 4.68934 13.0484 4.17768 12.6251L1.82181 13.299L0.321808 10.701L2.08269 8.99834C2.02831 8.67366 2.00001 8.34013 2.00001 8C2.00001 7.65987 2.02831 7.32634 2.08269 7.00166L0.321808 5.29904L1.82181 2.70096L4.17768 3.37488C4.68934 2.95155 5.27241 2.6115 5.90614 2.37548L6.50001 0ZM8.00001 10C9.10458 10 10 9.10457 10 8C10 6.89543 9.10458 6 8.00001 6C6.89544 6 6.00001 6.89543 6.00001 8C6.00001 9.10457 6.89544 10 8.00001 10Z"
							fill="currentColor"
						/>
					</svg>
				</button>
			</div>
		</div>
		<p v-if="props.streamer.description" class="description">{{ props.streamer.description }}</p>
		<p v-else class="description empty">No description</p>
		<div class="card-footer">
			<span class="created">Joined {{ formatDate(props.streamer.created_at) }}</span>
			<a
				:href="`https://twitch.tv/${props.streamer.login}`"
				target="_blank"
				rel="noopener noreferrer"
				class="profile-link"
			>
				Open channel
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { StreamersDetails } from '@/stores/twitch.store';
import { useNavigationStore } from '@/stores/navigation.store';
import { useTwitchStore } from '@/stores/twitch.store';
import { useUserSettingsStore } from '@/stores/user-settings.store';
import { getStreamerNotifications } from '@/services/storage.service';
import { storeToRefs } from 'pinia';
import { formatDate } from '@/utils/utils';
import { hasActiveNotifications } from '@/utils/utils';
import StreamerTypeBadge from '@/components/StreamerTypeBadge.vue';

interface Props {
	streamer: StreamersDetails;
}

const props = defineProps<Props>();

const navigationStore = useNavigationStore();
const twitchStore = useTwitchStore();
const userSettingsStore = useUserSettingsStore();
const { currentScreen, selectedStreamer } = storeToRefs(navigationStore);
const { followedLiveStreams } = storeToRefs(twitchStore);
const { userSettingsState } = storeToRefs(userSettingsStore);

const avatarLoaded = ref(false);

function openStreamerSettings(streamerDetails: StreamersDetails) {
	selectedStreamer.value = streamerDetails;
	navigationStore.navigateTo('streamer-settings');
}

const isLive = computed(() =>
	followedLiveStreams.value.some((stream) => stream.user_id === props.streamer.id)
);

const hasNotificationsEnabled = computed(() =>
	hasActiveNotifications(userSettingsState.value, props.streamer.id)
);
</script>

<style scoped>
.streamer-card {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 5px;
	border-bottom: 1px solid var(--color-border);
	transition: background 0.2s ease;

	animation: card-content-in 0.35s ease both;
	animation-delay: calc(min(var(--i, 0), 8) * 40ms);

	&:hover {
		background: var(--color-bg-secondary);
	}
}

.card-header {
	display: flex;
	/* align-items: center; */
	justify-content: space-between;
	gap: 12px;
}

.avatar-wrap {
	position: relative;
	flex-shrink: 0;
	width: 60px;
	height: 60px;
}

.avatar {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	object-fit: cover;

	opacity: 0;
	transition: opacity 0.25s ease;
}

.avatar.loaded {
	opacity: 1;
}

.avatar-skeleton {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: linear-gradient(
		90deg,
		var(--color-bg-secondary) 25%,
		var(--color-border) 50%,
		var(--color-bg-secondary) 75%
	);
	background-size: 200% 100%;
	animation: skeleton-loading 1.2s infinite;
	transition: opacity 0.25s ease;
	pointer-events: none;
}

.avatar-skeleton.hidden {
	opacity: 0;
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

.live-badge {
	position: absolute;
	bottom: -2px;
	left: 50%;
	transform: translateX(-50%);
	background: var(--color-red);
	color: white;
	font-size: 10px;
	font-weight: 700;
	line-height: 1;
	padding: 2px 6px;
	border-radius: 4px;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	white-space: nowrap;
}

.header-info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.display-name {
	margin: 0;
	font-size: 16px;
	font-weight: 700;
	color: var(--color-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.login {
	font-size: 12px;
	color: var(--color-text-dim);
}

.description {
	margin: 0;
	font-size: 13px;
	line-height: 1.4;
	color: var(--color-text-muted);
	overflow: hidden;
}

.description.empty {
	color: var(--color-text-dim);
	font-style: italic;
}

.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.created {
	font-size: 11px;
	color: var(--color-text-dim);
}

.profile-link {
	font-size: 12px;
	font-weight: 600;
	color: var(--color-accent);
	text-decoration: none;
	transition: color 0.2s;

	&:hover {
		color: var(--color-accent-hover);
		text-decoration: underline;
	}
}

.buttons {
	display: flex;
	gap: 12px;
}

.notif-toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	margin-left: auto;
	flex-shrink: 0;
	border: 1px solid var(--color-border);
	border-radius: 8px;
	background: var(--color-bg);
	cursor: pointer;
	transition: all 0.2s ease;
	color: var(--color-notif-icon);
}

.notif-toggle.active {
	background: var(--color-bg-secondary);
	border-color: var(--color-notif-active);
	color: var(--color-notif-active);
}

.notif-toggle {
	.cog-icon {
		transition: transform 0.3s;
	}

	&:hover .cog-icon {
		transform: rotate(90deg);
	}
}
</style>
