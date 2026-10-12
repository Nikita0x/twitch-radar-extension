import { CLIENT_ID } from '@/constants';
import type { Stream } from '@/stores/twitch.store';
import { request, type Result, ok, type Response } from '@/types/result';

export async function fetchFollowedLiveStreams(
	token: string,
	userId: string
): Promise<Result<Stream[]>> {
	const allStreams: Stream[] = [];
	let cursor: string | undefined;

	do {
		const url = new URL('https://api.twitch.tv/helix/streams/followed');
		url.searchParams.set('user_id', userId);
		url.searchParams.set('first', '100');
		if (cursor) {
			url.searchParams.set('after', cursor);
		}

		const result = await request<Response<Stream[]>>(url.toString(), {
			headers: {
				'Client-ID': CLIENT_ID,
				Authorization: `Bearer ${token}`,
			},
		});

		if (!result.ok) {
			console.error(result.error);
			return result;
		}

		allStreams.push(...result.data.data);
		cursor = result.data.pagination?.cursor;
	} while (cursor);

	return ok(allStreams);
}

// Unlike /streams/followed this works for any channel, so it's how tracked
// (not followed) channels are polled. Only live channels are returned.
export async function fetchStreamsByUserIds(
	token: string,
	userIds: string[]
): Promise<Result<Stream[]>> {
	const allStreams: Stream[] = [];

	for (let i = 0; i < userIds.length; i += 100) {
		const url = new URL('https://api.twitch.tv/helix/streams');
		url.searchParams.set('first', '100');
		for (const id of userIds.slice(i, i + 100)) {
			url.searchParams.append('user_id', id);
		}

		const result = await request<Response<Stream[]>>(url.toString(), {
			headers: {
				'Client-ID': CLIENT_ID,
				Authorization: `Bearer ${token}`,
			},
		});

		if (!result.ok) {
			console.error(result.error);
			return result;
		}

		allStreams.push(...result.data.data);
	}

	return ok(allStreams);
}

/** Followed + tracked live streams, deduplicated (a tracked channel may also be followed). */
export async function fetchLiveStreams(
	token: string,
	userId: string,
	trackedIds: string[]
): Promise<Result<Stream[]>> {
	const followedResult = await fetchFollowedLiveStreams(token, userId);
	if (!followedResult.ok) return followedResult;

	const followed = followedResult.data;
	const followedIds = new Set(followed.map((s) => s.user_id));
	const notFollowedIds = trackedIds.filter((id) => !followedIds.has(id));

	if (notFollowedIds.length === 0) return ok(followed);

	const trackedResult = await fetchStreamsByUserIds(token, notFollowedIds);

	// Tracked channels are an extra — failing them must not hide followed streams.
	if (!trackedResult.ok) return ok(followed);

	return ok([...followed, ...trackedResult.data]);
}

export interface SearchedChannel {
	id: string;
	broadcaster_login: string;
	display_name: string;
	thumbnail_url: string;
	is_live: boolean;
	game_name: string;
}

export async function searchChannels(
	token: string,
	query: string
): Promise<Result<SearchedChannel[]>> {
	const url = new URL('https://api.twitch.tv/helix/search/channels');
	url.searchParams.set('query', query);
	url.searchParams.set('first', '10');

	const result = await request<Response<SearchedChannel[]>>(url.toString(), {
		headers: {
			'Client-ID': CLIENT_ID,
			Authorization: `Bearer ${token}`,
		},
	});

	if (!result.ok) {
		console.error(result.error);
		return result;
	}

	return ok(result.data.data);
}
