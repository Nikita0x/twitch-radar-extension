import { getStreamerNotifications, type UserSettings } from '@/services/storage.service';
import { NEW_STREAM_THRESHOLD_MINUTES } from '@/constants';

export function formatUptime(startedAt: string) {
	const started = new Date(startedAt);
	const now = new Date();
	const diffMs = Math.max(0, now.getTime() - started.getTime());
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}
	return `${minutes}m`;
}

export function isNewStream(startedAt: string) {
	const diffMs = Date.now() - new Date(startedAt).getTime();

	return diffMs < NEW_STREAM_THRESHOLD_MINUTES * 60 * 1000;
}

export function formatDate(dateStr: string) {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function extractTokenFromUrl(url: string) {
	try {
		const hash = new URL(url).hash.substring(1);
		const params = new URLSearchParams(hash);
		return params.get('access_token');
	} catch {
		return null;
	}
}

export function hasActiveNotifications(settings: UserSettings, streamerId: string) {
	const notifications = getStreamerNotifications(settings, streamerId);

	return (
		notifications.live.enabled ||
		notifications.titleChange.enabled ||
		notifications.categoryChange.enabled
	);
}

/** Returns a positive number if `a` is newer than `b`, negative if older, 0 if equal ("1.10.0" > "1.9.0"). */
export function compareVersions(a: string, b: string) {
	const aParts = a.split('.').map(Number);
	const bParts = b.split('.').map(Number);

	for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
		const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
		if (diff !== 0) return diff;
	}

	return 0;
}

export function debounce(fn: () => void, delayMs: number) {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return () => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(fn, delayMs);
	};
}

export function getPreview(login: string, tick: number) {
	const width = 200 + tick;

	return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-${width}x100.jpg`;
}
