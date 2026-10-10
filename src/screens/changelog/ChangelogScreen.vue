<template>
	<div class="changelog-container custom-scrollbar">
		<TabSwitcher
			v-model="activeTab"
			:tabs="[
				{ value: 'changelog', label: 'Changelog' },
				{ value: 'ideas', label: 'Ideas' },
			]"
		/>

		<template v-if="activeTab === 'changelog'">
			<section v-for="release in CHANGELOG" :key="release.version" class="release">
				<div class="release-header">
					<h2 class="release-title">v{{ release.version }}</h2>

					<span class="release-date">
						{{ release.date }}
					</span>
				</div>

				<div class="cards">
					<ChangelogCard
						v-for="(item, index) in release.items"
						:key="item.title"
						:item="item"
						:highlight="unseenVersions.has(release.version)"
						:style="{ '--i': index }"
					/>
				</div>
			</section>
		</template>

		<template v-else>
			<section class="release">
				<p class="ideas-disclaimer">
					Stuff I'm considering — not promises, no ETAs. Got a request? Open a
					<a
						href="https://github.com/Nikita0x/chrome-extension/issues"
						target="_blank"
						rel="noopener noreferrer"
						>GitHub issue</a
					>.
				</p>

				<div class="cards">
					<ChangelogCard v-for="item in IDEAS" :key="item.title" :item="item" />
				</div>
			</section>
		</template>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useChangelogStore } from '@/stores/changelog.store';
import ChangelogCard from '@/screens/changelog/components/ChangelogCard.vue';
import TabSwitcher from '@/components/TabSwitcher.vue';
import { CHANGELOG, IDEAS } from '@/screens/changelog/changelog.data';

const activeTab = ref<'changelog' | 'ideas'>('changelog');

const changelogStore = useChangelogStore();

// Snapshot taken before marking everything as seen, so the highlight plays on
// this visit only and the header dot clears as soon as the screen opens.
const unseenVersions = new Set(
	CHANGELOG.filter((release) => changelogStore.isUnseen(release.version)).map(
		(release) => release.version
	)
);

onMounted(() => changelogStore.markAllSeen());
</script>

<style scoped>
.changelog-container {
	display: flex;
	flex-direction: column;
	gap: 28px;
	padding: 16px;
	overflow: auto;
	height: 100%;
}

.ideas-disclaimer {
	margin: 0;

	color: var(--color-text-dim);
	font-size: 13px;
	line-height: 1.5;
}

.ideas-disclaimer a {
	color: var(--color-link);
}

.container {
	display: flex;
	flex-direction: column;
	gap: 28px;

	padding: 16px;
}

.release {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.release-header {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.release-title {
	margin: 0;
	color: var(--color-text);
	font-size: 20px;
	font-weight: 700;
}

.release-date {
	color: var(--color-text-dim);
	font-size: 13px;
}

.cards {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>
