<template>
	<div class="twitch-auth custom-scrollbar">
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

		<div v-if="isAuthenticated && user" class="account-section">
			<h3 class="section-title">Account</h3>
			<div class="account-row">
				<img :src="user.profile_image_url" class="account-avatar" :alt="user.display_name" />
				<span class="account-name">{{ user.display_name }}</span>
				<button @click="logout" class="logout-btn">Logout</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useTwitchStore } from '@/stores/twitch.store.ts';
import { useUserSettingsStore } from '@/stores/user-settings.store.ts';
import { useNavigationStore } from '@/stores/navigation.store.ts';

const twitchStore = useTwitchStore();
const userSettingsStore = useUserSettingsStore();
const navigationStore = useNavigationStore();

const { user, isAuthenticated } = storeToRefs(twitchStore);
const { userSettingsState } = storeToRefs(userSettingsStore);

async function logout() {
	await twitchStore.logout();
	navigationStore.switchTab('favorites');
}
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

.account-section {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px 5px;
	border-top: 1px solid var(--color-border);
}

.section-title {
	font-size: 14px;
	font-weight: 700;
	color: var(--color-text);
}

.account-row {
	display: flex;
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
</style>
