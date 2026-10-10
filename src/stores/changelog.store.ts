import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { CHANGELOG } from '@/screens/changelog/changelog.data';
import {
	getLastSeenChangelogVersion,
	saveLastSeenChangelogVersion,
} from '@/services/storage.service';
import { compareVersions } from '@/utils/utils';

export const useChangelogStore = defineStore('changelog', () => {
	const lastSeenVersion = ref<string | null>(null);

	const latestVersion = CHANGELOG[0]!.version;

	const hasUnseen = computed(() => isUnseen(latestVersion));

	async function load() {
		lastSeenVersion.value = await getLastSeenChangelogVersion();
	}

	// null means the key was never written (e.g. a dev reload) — treat as "nothing new"
	// rather than flashing every release. Installs and updates always write it.
	function isUnseen(version: string) {
		if (!lastSeenVersion.value) return false;
		return compareVersions(version, lastSeenVersion.value) > 0;
	}

	async function markAllSeen() {
		if (!hasUnseen.value) return;

		lastSeenVersion.value = latestVersion;
		await saveLastSeenChangelogVersion(latestVersion);
	}

	return { hasUnseen, load, isUnseen, markAllSeen };
});
