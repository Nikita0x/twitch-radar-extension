<template>
	<div class="settings custom-scrollbar">
		<section class="section">
			<h3 class="section-title">Appearance</h3>
			<div class="card">
				<Toggle
					label="Dark theme"
					description="Easier on the eyes at night."
					:checked="userSettingsState.theme === 'dark'"
					@change="userSettingsStore.toggleTheme()"
				/>
				<Toggle
					label="Live previews (experimental)"
					description="Refreshes stream thumbnails every 30 seconds while the popup is open. May stop working if Twitch changes how previews are cached."
					:checked="userSettingsState.livePreviews"
					@change="userSettingsStore.toggleLivePreviews()"
				/>
			</div>
		</section>

		<section class="section">
			<h3 class="section-title">Notifications</h3>
			<div class="card">
				<button class="row-link" @click="navigationStore.switchTab('following')">
					<span class="row-text">
						Manage per-streamer notifications
						<span class="row-subtext">
							Enabled for {{ streamersWithNotifications }}
							{{ streamersWithNotifications === 1 ? 'streamer' : 'streamers' }}
						</span>
					</span>
					<span class="chevron">›</span>
				</button>

				<div class="test-notification">
					<button class="secondary-btn" @click="sendTestNotification">
						Send test notification
					</button>
					<p v-if="testStatus === 'sent'" class="hint">
						Didn't see it? Make sure notifications for your browser are allowed in your system
						settings and Do Not Disturb / Focus mode is off.
					</p>
					<p v-else-if="testStatus === 'failed'" class="hint error">
						Couldn't send a notification: {{ testError }}
					</p>
				</div>
			</div>
		</section>

		<section v-if="isAuthenticated && user" class="section">
			<h3 class="section-title">Account</h3>
			<div class="card account-row">
				<img :src="user.profile_image_url" class="account-avatar" :alt="user.display_name" />
				<span class="account-name">{{ user.display_name }}</span>
				<button @click="logout" class="logout-btn">Logout</button>
			</div>
		</section>

		<section class="section">
			<h3 class="section-title">About</h3>
			<div class="card">
				<div class="about-row">
					<span class="about-label">Version</span>
					<span>{{ version }}</span>
				</div>
				<div class="about-row">
					<span class="about-label">Extension ID</span>
					<code class="extension-id">{{ extensionId }}</code>
					<button class="copy-btn" @click="copyExtensionId">
						{{ copied ? 'Copied!' : 'Copy' }}
					</button>
				</div>

				<a class="row-link" :href="STORE_REVIEW_URL" target="_blank" rel="noopener noreferrer">
					<span>★ Rate Twitch Radar on {{ STORE_NAME }}</span>
					<span class="chevron">›</span>
				</a>
				<a class="row-link" :href="ISSUES_URL" target="_blank" rel="noopener noreferrer">
					<span>🐞 Report a bug or request a feature</span>
					<span class="chevron">›</span>
				</a>
				<a class="row-link" :href="PRIVACY_POLICY_URL" target="_blank" rel="noopener noreferrer">
					<span>🔒 Privacy policy</span>
					<span class="chevron">›</span>
				</a>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useTwitchStore } from '@/stores/twitch.store.ts';
import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { useNavigationStore } from '@/stores/navigation.store.ts';
import { hasActiveNotifications } from '@/utils/utils';
import Toggle from '@/components/Toggle.vue';

const STORE_NAME = import.meta.env.FIREFOX ? 'Firefox Add-ons' : 'Chrome Web Store';
const STORE_REVIEW_URL = import.meta.env.FIREFOX
	? 'https://addons.mozilla.org/en-US/firefox/addon/twitch-radar-live-notifs/'
	: 'https://chromewebstore.google.com/detail/fcjbgobfppjggabcbbnngehhefllbllm/reviews';
const ISSUES_URL = 'https://github.com/Nikita0x/chrome-extension/issues';
const PRIVACY_POLICY_URL = 'https://nikita0x.github.io/twitch-radar-extension/privacy-policy.html';

const twitchStore = useTwitchStore();
const userSettingsStore = useUserSettingsStore();
const navigationStore = useNavigationStore();

const { user, isAuthenticated } = storeToRefs(twitchStore);
const { userSettingsState } = storeToRefs(userSettingsStore);

const version = browser.runtime.getManifest().version;
const extensionId = browser.runtime.id;

const streamersWithNotifications = computed(
	() =>
		Object.keys(userSettingsState.value.notifications).filter((streamerId) =>
			hasActiveNotifications(userSettingsState.value, streamerId)
		).length
);

const testStatus = ref<'idle' | 'sent' | 'failed'>('idle');
const testError = ref('');

async function sendTestNotification() {
	const response = await browser.runtime.sendMessage({ type: 'SEND_TEST_NOTIFICATION' });

	testStatus.value = response?.ok ? 'sent' : 'failed';
	testError.value = response?.error ?? '';
}

const copied = ref(false);

async function copyExtensionId() {
	await navigator.clipboard.writeText(extensionId);
	copied.value = true;
	setTimeout(() => (copied.value = false), 1500);
}

async function logout() {
	await twitchStore.logout();
	navigationStore.switchTab('favorites');
}
</script>

<style scoped>
.settings {
	display: flex;
	flex-direction: column;
	gap: 16px;
	height: 100%;
	padding: 12px 16px;
	overflow: auto;
	background: var(--color-bg);
}

.section {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.section-title {
	margin: 0;
	font-size: 13px;
	font-weight: 700;
	color: var(--color-text-muted);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.card {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 12px;
	background: var(--color-bg-secondary);
	border-radius: 10px;
}

.row-link {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0;
	border: none;
	background: none;
	color: var(--color-text);
	font-size: 14px;
	text-align: left;
	text-decoration: none;
	cursor: pointer;
}

.row-link:hover {
	color: var(--color-accent);
}

.row-text {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.row-subtext {
	font-size: 12px;
	color: var(--color-text-dim);
}

.chevron {
	font-size: 18px;
	color: var(--color-text-dim);
}

.test-notification {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.secondary-btn {
	align-self: flex-start;
	padding: 6px 12px;
	border: 1px solid var(--color-accent);
	border-radius: 6px;
	background: transparent;
	color: var(--color-accent);
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.15s ease;
}

.secondary-btn:hover {
	background: rgba(145, 70, 255, 0.12);
}

.hint {
	margin: 0;
	font-size: 12px;
	color: var(--color-text-dim);
}

.hint.error {
	color: var(--color-error);
}

.account-row {
	flex-direction: row;
	align-items: center;
	gap: 10px;
}

.account-avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
}

.account-name {
	flex: 1;
	font-size: 14px;
	color: var(--color-text);
}

.logout-btn {
	background-color: var(--color-red);
	color: white;
	border: none;
	padding: 5px 10px;
	border-radius: 4px;
	cursor: pointer;
	transition: 0.3s ease all;
}

.logout-btn:hover {
	filter: brightness(1.2);
}

.about-row {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	color: var(--color-text);
}

.about-label {
	color: var(--color-text-dim);
	min-width: 90px;
}

.extension-id {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 12px;
}

.copy-btn {
	padding: 2px 8px;
	border: 1px solid var(--color-border-input);
	border-radius: 4px;
	background: var(--color-bg);
	color: var(--color-text);
	font-size: 12px;
	cursor: pointer;
}
</style>
