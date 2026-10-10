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
                    <ChangelogCard v-for="item in release.items" :key="item.title" :item="item" />
                </div>
            </section>
        </template>

        <template v-else>
            <section class="release">
                <p class="ideas-disclaimer">
                    Stuff I'm considering — not promises, no ETAs. Got a request? Open a
                    <a href="https://github.com/Nikita0x/chrome-extension/issues" target="_blank"
                        rel="noopener noreferrer">GitHub issue</a>.
                </p>

                <div class="cards">
                    <ChangelogCard v-for="item in IDEAS" :key="item.title" :item="item" />
                </div>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Component } from 'vue';
import ChangelogCard from '@/screens/changelog/components/ChangelogCard.vue';
import TabSwitcher from '@/components/TabSwitcher.vue';
import LivePreviewDemo from '@/screens/changelog/components/LivePreviewDemo.vue';

const activeTab = ref<'changelog' | 'ideas'>('changelog');

interface Changelog {
    version: string;
    date: string;
    items: ChangelogItem[];
}

export interface ChangelogItem {
    icon?: string;
    title: string;
    description?: string;
    bullets?: string[];
    preview?: Component;
    link?: { label: string; url: string };
}
const CHANGELOG: Changelog[] = [
    {
        version: '1.6.0',
        date: 'October 2026',
        items: [
            {
                icon: '☁️',
                title: 'Settings Sync',
                description:
                    'Your Twitch Radar settings are now synced to the cloud and linked to your Twitch account. Your preferences can now follow you across installations.',
            },
        ],
    },
    {
        version: '1.5.0',
        date: 'August 2026',
        items: [
            {
                icon: '🦊',
                title: 'Now available on Firefox!',
                description: 'Twitch Radar is now published on Firefox Add-ons.',
                link: {
                    label: 'Get it on Firefox Add-ons',
                    url: 'https://addons.mozilla.org/en-US/firefox/addon/twitch-radar-live-notifs/',
                },
            },
            {
                icon: '💡',
                title: 'Ideas tab',
                description:
                    "A new tab in the Changelog screen for browsing features and ideas I'm considering — nothing here is guaranteed or has a release date.",
            },
            {
                icon: '👋',
                title: 'Uninstall survey',
                description:
                    "If you ever uninstall Twitch Radar, you'll now see a short, optional survey asking why. Totally skippable — but if you fill it in, it genuinely helps me improve things.",
            },
            {
                icon: '🔒',
                title: 'Privacy Policy',
                description:
                    'Added a Privacy Policy page explaining exactly what data the extension does (and does not) collect.',
                link: {
                    label: 'Read the Privacy Policy',
                    url: 'https://nikita0x.github.io/twitch-radar-extension/privacy-policy.html',
                },
            },
            {
                title: 'Other',
                bullets: [
                    'Fixed an authentication issue (my mistake 😅). Added an uninstall survey - to quicker identify critical bugs. Thanks for your patience!',
                    'Fixed the issue with race conditions',
                ],
            },
        ],
    },
    {
        version: '1.4.0',
        date: 'August 2026',
        items: [
            {
                icon: '📰',
                title: 'Added Changelog',
                description: 'Keep track of new features, improvements, fixes, and other updates.',
            },
            {
                icon: '✨',
                title: 'Live Previews (Experimental)',
                description:
                    'Preview thumbnails now refresh automatically every 30 seconds while the popup is open.',
            },
            {
                icon: '📈',
                title: 'Animated Viewer Count',
                description: 'Viewer count now animates smoothly and highlights increases and decreases.',
                preview: LivePreviewDemo,
            },
            {
                title: 'Other',
                bullets: [
                    "Moved red dot (Live) next to a streamer's name.",
                    'Removed 🕒 emoji.',
                    'Changed viewers icon.',
                ],
            },
        ],
    },
];

const IDEAS: ChangelogItem[] = [
    // {
    // 	icon: '🔔',
    // 	title: 'Keyword notifications',
    // 	description: 'Get notified when a stream title contains specific keywords you set.',
    // },
    // {
    // 	icon: '🌙',
    // 	title: 'Quiet hours',
    // 	description: "Mute notifications during hours you set — no pings while you're asleep.",
    // },
    {
        icon: '🎨',
        title: 'Streamer groups',
        description: 'Organize followed streamers into custom, color-coded groups.',
    },
    {
        icon: '🙈',
        title: 'Hide streamers',
        description: 'Hide streamers from your list without unfollowing them on Twitch.',
    },
    {
        icon: '🔊',
        title: 'Custom notification sounds',
        description: 'Pick a sound per event, or upload your own.',
    },
    {
        icon: '➕',
        title: 'Track channels without following',
        description: 'Add a channel to your radar without following it on Twitch.',
    },
    {
        icon: '💜',
        title: 'Support page',
        description: 'A page for donations and sponsors, for anyone who wants to support the project.',
    },
];
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
