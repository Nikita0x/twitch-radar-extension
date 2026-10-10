<template>
    <div class="testing-container">
        <p @click="putUserSettings(storage.auth.accessToken, userSettingsState)">
            putUserSettings
        </p>

        <p @click="getUserSettingsFromDatabase(storage.auth.accessToken)">
            getUserSettings
        </p>
        <p>What is the reason for uninstall?</p>
        <p>{{ reason }}</p>
        <textarea v-model="reason" />

        <button @click="sendFeedback(reason)">Submit</button>
        <p v-if="status">{{ status }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { request } from '@/types/result';
import type { Feedback } from '@shared/feedback.interface';
import type { UserSettings } from '@/services/storage.service';
import { storeToRefs } from 'pinia';
import { useStorageStore } from '@/stores/storage.store';
import { useUserSettingsStore } from '@/stores/user-settings.store';
import { getUserSettingsFromDatabase, putUserSettings } from '@/services/cloudflare.service';

const reason = ref<string>('');
const status = ref<string>('');

const storageStore = useStorageStore();
const userSettingsStore = useUserSettingsStore();
const { storage } = storeToRefs(storageStore)
const { userSettingsState } = storeToRefs(userSettingsStore)



async function sendFeedback(comment: string) {
    const manifestVersion = browser.runtime.getManifest().version;
    const operatingSystem = (await browser.runtime.getPlatformInfo()).os;
    const extensionID = browser.runtime.id;
    const browserName = navigator.userAgent;

    const feedback: Feedback = {
        reasons: ['other'],
        comment,
        manifestVersion,
        operatingSystem,
        extensionID,
        browserName,
    };

    const resp = await request(`${import.meta.env.WXT_WORKER_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
    });

    status.value = resp.ok ? 'Feedback sent!' : `Error: ${resp.error.message}`;
}



</script>

<style scoped>
.testing-container {
    display: flex;
    flex-direction: column;
}
</style>
