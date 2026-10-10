<template>
	<div class="header">
		<div class="title">
			<template v-if="canGoBack">
				<button class="icon-btn back-btn" @click="navigationStore.back()" title="Back">
					<svg
						width="20px"
						height="20px"
						viewBox="0 0 200 200"
						fill="currentColor"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M160,89.75H56l53-53a9.67,9.67,0,0,0,0-14,9.67,9.67,0,0,0-14,0l-56,56a30.18,30.18,0,0,0-8.5,18.5c0,1-.5,1.5-.5,2.5a6.34,6.34,0,0,0,.5,3,31.47,31.47,0,0,0,8.5,18.5l56,56a9.9,9.9,0,0,0,14-14l-52.5-53.5H160a10,10,0,0,0,0-20Z"
						/>
					</svg>
				</button>
				<span class="screen-title">{{ SCREEN_TITLES[currentScreen] }}</span>
			</template>
			<TabSwitcher
				v-else-if="isAuthenticated"
				class="header-tabs"
				:model-value="activeTab"
				:tabs="[
					{ value: 'favorites', label: 'Live', count: followedLiveStreams.length },
					{ value: 'following', label: 'Following', count: followedAllStreams.length || undefined },
				]"
				@update:model-value="navigationStore.switchTab"
			/>
			<span v-else class="brand">Twitch Radar</span>
		</div>
		<div class="buttons">
			<!-- <button class="icon-btn heart-btn" title="Favorites"><img src="/heart.svg" width="20" height="20"
                    class="heart-icon" /></button> -->
			<button
				v-if="isAuthenticated && !canGoBack"
				class="icon-btn heart-btn"
				:title="hasUnseenChangelog ? 'Changelog — something new!' : 'Changelog'"
				@click="navigationStore.navigateTo('changelog')"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					xml:space="preserve"
					width="20"
					height="20"
					viewBox="0 0 32 32"
					fill="currentColor"
					class="heart-icon"
				>
					<g stroke="#000" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2">
						<path d="M27 5V3H1v26a2 2 0 0 0 2 2h26a2 2 0 0 0 2-2V5z" />
						<path
							d="M5 19h10v8H5zM27 5v19M27 26v2M4 11h20M4 7h20M4 15h20M18 19h6M18 23h6M18 27h6"
						/>
					</g>
				</svg>
				<span v-if="hasUnseenChangelog" class="unseen-dot"></span>
			</button>
			<button
				v-if="isAuthenticated && !canGoBack"
				class="icon-btn cog-btn"
				title="Settings"
				@click="navigationStore.navigateTo('settings')"
			>
				<svg
					width="20px"
					height="20px"
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
</template>

<script setup lang="ts">
import { useTwitchStore } from '@/stores/twitch.store';
import { useNavigationStore, type Screen } from '@/stores/navigation.store';
import { storeToRefs } from 'pinia';
import TabSwitcher from '@/components/TabSwitcher.vue';
import { useChangelogStore } from '@/stores/changelog.store';

const SCREEN_TITLES: Record<Screen, string> = {
	favorites: 'Live',
	following: 'Following',
	settings: 'Settings',
	'streamer-settings': 'Notification settings',
	changelog: 'Changelog',
	testing: 'Testing',
};

const twitchStore = useTwitchStore();
const navigationStore = useNavigationStore();
const { isAuthenticated, followedLiveStreams, followedAllStreams } = storeToRefs(twitchStore);
const { currentScreen, activeTab, canGoBack } = storeToRefs(navigationStore);
const { hasUnseen: hasUnseenChangelog } = storeToRefs(useChangelogStore());
</script>

<style scoped>
.header {
	background-color: var(--color-header-bg);
	min-height: 50px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 5px;
}

.title {
	display: flex;
	align-items: center;
	color: var(--color-header-text);
}

.screen-title {
	font-weight: bold;
	font-size: 15px;
	margin-left: 4px;
}

/*
 * No transparency on header tab text: white on the light header purple is only
 * ~4.6:1 at full opacity (WCAG AA needs 4.5), so any fade drops below AA.
 * Active vs inactive is told apart by the underline alone.
 */
.header-tabs {
	--tabs-bg: transparent;
	--tab-radius: 0;
	--tab-color: #fff;
	--tab-hover-color: #fff;
	--tab-hover-indicator: rgba(255, 255, 255, 0.4);
	--tab-active-bg: transparent;
	--tab-active-color: #fff;
	--tab-indicator: #fff;
	--tab-count-opacity: 1;
}

[data-theme='dark'] .header-tabs {
	--tab-color: var(--color-text-muted);
	--tab-hover-indicator: rgba(145, 70, 255, 0.5);
	--tab-indicator: var(--color-accent);
}

.brand {
	font-weight: bold;
	font-size: 15px;
}

.buttons {
	display: flex;
	gap: 6px;
	align-items: center;
}

.icon-btn {
	background: none;
	border: none;
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	font-size: 18px;
	transition: background 0.15s ease;
	color: var(--color-header-text);
}

.icon-btn:hover {
	background: rgba(0, 0, 0, 0.1);
}

/* Cog spin animation */
@keyframes cog-spin {
	to {
		transform: rotate(360deg);
	}
}

.cog-icon,
.heart-icon {
	display: block;
	transition: transform 0.3s ease;
	color: var(--color-header-text);
}

.cog-btn:hover .cog-icon {
	transform: rotate(90deg);
}

.heart-btn {
	position: relative;
}

.unseen-dot {
	position: absolute;
	top: 2px;
	right: 2px;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--color-red);
	box-shadow: 0 0 0 2px var(--color-header-bg);
	animation: unseen-pulse 1.6s ease-in-out infinite;
}

@keyframes unseen-pulse {
	50% {
		transform: scale(1.25);
	}
}

@media (prefers-reduced-motion: reduce) {
	.unseen-dot {
		animation: none;
	}
}

.heart-btn:hover .heart-icon {
	transform: scale(1.1);
}
</style>
