import type { Component } from 'vue';
import LivePreviewDemo from '@/screens/changelog/components/LivePreviewDemo.vue';

export interface Changelog {
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
export const CHANGELOG: Changelog[] = [
	{
		version: '1.7.0',
		date: 'October 2026',
		items: [
			{
				icon: '🗂️',
				title: 'Live & Following tabs',
				description:
					"Switch between who's live and everyone you follow right from the top bar. The extension title is gone — more room for what matters.",
			},
			{
				icon: '🆕',
				title: '"New" badge',
				description:
					'Streams that went live less than 15 minutes ago are now marked with a NEW badge.',
			},
			{
				icon: '🔔',
				title: 'Test notifications',
				description:
					'Not getting alerts? Settings now has a "Send test notification" button — if it doesn\'t show up, the issue is in your system settings (notification permissions or Do Not Disturb), not the extension.',
			},
			{
				icon: '⚙️',
				title: 'Redesigned Settings',
				description:
					'Settings are now grouped into sections. The new About section shows your version and extension ID (handy for bug reports), plus a quick way to rate Twitch Radar — reviews really help a small project grow ❤️',
			},
			{
				icon: '✨',
				title: "What's new indicator",
				description:
					"A red dot on the changelog icon lets you know when there's something new — like right now 👀",
			},
			{
				title: 'Other',
				bullets: [
					'Theme now switches instantly',
					'Settings sync is faster and sends fewer requests',
					'Improved security of cloud settings sync',
					'Consistent scrollbars across all screens',
				],
			},
		],
	},
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

export const IDEAS: ChangelogItem[] = [
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
