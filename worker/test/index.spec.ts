import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('CORS allowlist', () => {
	it('allows the Chrome Web Store (production) extension ID', async () => {
		const request = new IncomingRequest('https://worker.example.com/feedback', {
			method: 'OPTIONS',
			headers: {
				Origin: 'chrome-extension://fcjbgobfppjggabcbbnngehhefllbllm',
				'Access-Control-Request-Method': 'POST',
			},
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
			'chrome-extension://fcjbgobfppjggabcbbnngehhefllbllm'
		);
	});

	it('allows the local unpacked dev-install extension ID', async () => {
		const request = new IncomingRequest('https://worker.example.com/feedback', {
			method: 'OPTIONS',
			headers: {
				Origin: 'chrome-extension://anejamjbmgpekamgljajekmgnbppnjao',
				'Access-Control-Request-Method': 'POST',
			},
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
			'chrome-extension://anejamjbmgpekamgljajekmgnbppnjao'
		);
	});

	it('rejects an origin that is neither extension ID', async () => {
		const request = new IncomingRequest('https://worker.example.com/feedback', {
			method: 'OPTIONS',
			headers: {
				Origin: 'chrome-extension://some-random-other-extension',
				'Access-Control-Request-Method': 'POST',
			},
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
	});
});

describe('routes', () => {
	it('serves the uninstall survey page as HTML', async () => {
		const response = await SELF.fetch('https://worker.example.com/uninstall');

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('text/html');
	});

	it('returns 404 for unknown paths', async () => {
		const response = await SELF.fetch('https://worker.example.com/does-not-exist');

		expect(response.status).toBe(404);
	});
});

describe('/settings authentication', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	async function callSettings(headers: Record<string, string> = {}) {
		const request = new IncomingRequest('https://worker.example.com/settings', { headers });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		return response;
	}

	function mockTwitchValidate(response: Response) {
		return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
	}

	it('rejects a request without a token', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');

		const response = await callSettings();

		expect(response.status).toBe(401);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('ignores a user_id query param instead of trusting it', async () => {
		const request = new IncomingRequest('https://worker.example.com/settings?user_id=12345');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(401);
	});

	it('rejects a token Twitch says is invalid', async () => {
		const fetchSpy = mockTwitchValidate(new Response(null, { status: 401 }));

		const response = await callSettings({ Authorization: 'Bearer bad-token' });

		expect(response.status).toBe(401);
		expect(fetchSpy).toHaveBeenCalledWith(
			'https://id.twitch.tv/oauth2/validate',
			expect.objectContaining({ headers: { Authorization: 'OAuth bad-token' } })
		);
	});

	it('rejects a valid token issued to a different Twitch app', async () => {
		mockTwitchValidate(
			Response.json({
				client_id: 'some-other-app',
				login: 'victim',
				user_id: '12345',
				scopes: [],
				expires_in: 1000,
			})
		);

		const response = await callSettings({ Authorization: 'Bearer foreign-token' });

		expect(response.status).toBe(401);
	});

	it('allows the Authorization header in CORS preflight', async () => {
		const request = new IncomingRequest('https://worker.example.com/settings', {
			method: 'OPTIONS',
			headers: {
				Origin: 'chrome-extension://fcjbgobfppjggabcbbnngehhefllbllm',
				'Access-Control-Request-Method': 'PUT',
				'Access-Control-Request-Headers': 'authorization, content-type',
			},
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
	});
});
