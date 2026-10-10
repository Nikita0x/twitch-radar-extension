<template>
	<div class="streamer-settings custom-scrollbar">
		<div v-if="selectedStreamer" class="settings-content">
			<!-- Streamer header -->
			<div class="streamer-header">
				<div class="avatar-wrap">
					<img
						:src="selectedStreamer.profile_image_url"
						:alt="selectedStreamer.display_name"
						class="avatar"
						width="72"
						height="72"
					/>
					<span v-if="isLive" class="live-badge">LIVE</span>
				</div>
				<div class="header-info">
					<h2 class="display-name">{{ selectedStreamer.display_name }}</h2>
					<span class="login">@{{ selectedStreamer.login }}</span>
					<p class="login">{{ selectedStreamer.description }}</p>
					<p class="login">Joined {{ formatDate(selectedStreamer.created_at) }}</p>
					<StreamerTypeBadge :type="selectedStreamer.broadcaster_type" />
				</div>
			</div>

			<!-- Notification settings -->
			<div class="settings-section">
				<h3 class="section-title">Notification Settings</h3>

				<div class="toggle-row">
					<Toggle
						label="Notify when goes live"
						description="Get notified when the streamer starts streaming"
						:checked="streamerNotifications?.live.enabled"
						@change="handleToggleLiveNotification"
					/>
					<Toggle
						label="Auto-open when live"
						description="Automatically open a new tab when streamer goes live"
						:disabled="!streamerNotifications?.live.enabled"
						:checked="streamerNotifications?.live.autoOpen"
						@change="handleToggleLiveAutoOpen"
					/>
				</div>

				<div class="toggle-row">
					<Toggle
						label="Notify on title change"
						description="Get notified when the streamer changes the stream title."
						:checked="streamerNotifications?.titleChange.enabled"
						@change="handleToggleTitleChangeNotification"
					/>
					<Toggle
						label="Auto-open when title changes"
						description="Automatically open a new tab when streamer changes the title of the stream"
						:disabled="!streamerNotifications?.titleChange.enabled"
						:checked="streamerNotifications?.titleChange.autoOpen"
						@change="handleToggleTitleChangeAutoOpen"
					/>
				</div>

				<div class="toggle-row">
					<Toggle
						label="Notify when category changes"
						description="Get notified when the streamer changes stream's category."
						:checked="streamerNotifications?.categoryChange.enabled"
						@change="handleToggleCategoryChangeNotification"
					/>
					<Toggle
						label="Auto-open when category changes"
						description="Automatically open a new tab when streamer changes category"
						:disabled="!streamerNotifications?.categoryChange?.enabled"
						:checked="streamerNotifications?.categoryChange.autoOpen"
						@change="handleToggleCategoryChangeAutoOpen"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useNavigationStore } from '@/stores/navigation.store';
import { useUserSettingsStore } from '@/stores/user-settings.store';
import { useTwitchStore } from '@/stores/twitch.store';
import { getStreamerNotifications } from '@/services/storage.service';
import { formatDate } from '@/utils/utils';
import StreamerTypeBadge from '@/components/StreamerTypeBadge.vue';
import Toggle from '@/components/Toggle.vue';

const navigationStore = useNavigationStore();
const userSettingsStore = useUserSettingsStore();
const twitchStore = useTwitchStore();

const { selectedStreamer } = storeToRefs(navigationStore);
const { userSettingsState } = storeToRefs(userSettingsStore);
const { followedLiveStreams } = storeToRefs(twitchStore);

const isLive = computed(() => {
	if (!selectedStreamer.value) return false;
	return followedLiveStreams.value.some((s) => s.user_id === selectedStreamer.value?.id);
});

const streamerNotifications = computed(() => {
	if (!selectedStreamer.value) return null;

	return getStreamerNotifications(userSettingsState.value, selectedStreamer.value.id);
});

async function handleToggleLiveNotification() {
	if (!selectedStreamer.value || !streamerNotifications.value) return;

	streamerNotifications.value.live.enabled = !streamerNotifications.value.live.enabled;

	await userSettingsStore.updateStreamerNotifications(
		selectedStreamer.value.id,
		streamerNotifications.value
	);
}

async function handleToggleLiveAutoOpen() {
	if (!selectedStreamer.value || !streamerNotifications.value) return;

	streamerNotifications.value.live.autoOpen = !streamerNotifications.value.live.autoOpen;

	await userSettingsStore.updateStreamerNotifications(
		selectedStreamer.value.id,
		streamerNotifications.value
	);
}

async function handleToggleTitleChangeNotification() {
	if (!selectedStreamer.value || !streamerNotifications.value) return;

	streamerNotifications.value.titleChange.enabled =
		!streamerNotifications.value.titleChange.enabled;

	await userSettingsStore.updateStreamerNotifications(
		selectedStreamer.value.id,
		streamerNotifications.value
	);
}

async function handleToggleTitleChangeAutoOpen() {
	if (!selectedStreamer.value || !streamerNotifications.value) return;

	streamerNotifications.value.titleChange.autoOpen =
		!streamerNotifications.value.titleChange.autoOpen;

	await userSettingsStore.updateStreamerNotifications(
		selectedStreamer.value.id,
		streamerNotifications.value
	);
}

async function handleToggleCategoryChangeNotification() {
	if (!selectedStreamer.value || !streamerNotifications.value) return;

	streamerNotifications.value.categoryChange.enabled =
		!streamerNotifications.value.categoryChange.enabled;

	await userSettingsStore.updateStreamerNotifications(
		selectedStreamer.value.id,
		streamerNotifications.value
	);
}
async function handleToggleCategoryChangeAutoOpen() {
	if (!selectedStreamer.value || !streamerNotifications.value) return;

	streamerNotifications.value.categoryChange.autoOpen =
		!streamerNotifications.value.categoryChange.autoOpen;

	await userSettingsStore.updateStreamerNotifications(
		selectedStreamer.value.id,
		streamerNotifications.value
	);
}
</script>

<style scoped>
.streamer-settings {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: auto;
}

.settings-content {
	padding: 8px 16px;
	display: flex;
	flex-direction: column;
	gap: 20px;
}

/* ── Streamer header ── */
.streamer-header {
	display: flex;
	align-items: center;
	gap: 16px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--color-border);
}

.avatar-wrap {
	position: relative;
	flex-shrink: 0;
}

.avatar {
	width: 72px;
	height: 72px;
	border-radius: 50%;
	object-fit: cover;
}

.live-badge {
	position: absolute;
	bottom: -2px;
	left: 50%;
	transform: translateX(-50%);
	background: var(--color-red);
	color: white;
	font-size: 11px;
	font-weight: 700;
	line-height: 1;
	padding: 2px 8px;
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
	font-size: 20px;
	font-weight: 700;
	color: var(--color-text);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.login {
	font-size: 13px;
	color: var(--color-text-dim);
}

/* ── Settings section ── */
.settings-section {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.section-title {
	margin: 0;
	font-size: 14px;
	font-weight: 700;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

/* ── Toggle rows ── */
.toggle-row {
	display: flex;
	flex-direction: column;
	padding: 12px;
	background: var(--color-bg-secondary);
	border-radius: 10px;
	gap: 12px;
}
</style>
