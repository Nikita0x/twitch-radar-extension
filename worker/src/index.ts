/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { UNINSTALL_REASON_LABELS, type Feedback } from '@shared/feedback.interface';
import uninstallHtml from './uninstall.html';

// Chrome assigns two different, both-permanent IDs for the same extension:
// one derived from the `key` pinned in wxt.config.ts (used for local unpacked
// dev installs), and one assigned by the Chrome Web Store on first upload
// (used by every published/production install — the store ignores the
// manifest `key` for ID purposes). CHROME_EXTENSION_ID (wrangler.jsonc `vars`)
// is a comma-separated list of both: the deployed worker needs to accept the
// dev ID too, since `npm run prod` points a locally-built unpacked extension
// at this same deployed worker for testing against the real backend. Firefox
// has no equivalent: moz-extension:// UUIDs are randomized per browser
// profile by design (anti-fingerprinting), so they can't be pinned — only
// the scheme prefix can be checked.
function isAllowedOrigin(origin: string | null, extensionIds: string): origin is string {
    if (!origin) return false;
    if (origin.startsWith('moz-extension://')) return true;
    return extensionIds.split(',').some((id) => origin === `chrome-extension://${id}`);
}

// No Access-Control-Allow-Origin at all (rather than a fixed value) is what
// makes disallowed origins fail: the browser refuses to send the real
// request once the OPTIONS preflight comes back without permission.
function corsHeaders(origin: string | null, extensionIds: string): HeadersInit {
    if (!isAllowedOrigin(origin, extensionIds)) return {};

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// Telegram's HTML parse_mode only understands a small tag subset, and rejects
// the whole message with a 400 if free-text content (reason/comment, typed
// by the user) happens to contain something that looks like a tag. Escaping
// is what keeps user-typed text from being interpreted as markup at all.
function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatFeedbackMessage(feedback: Feedback): string {
    const reasonLabels = feedback.reasons.map((reason) => UNINSTALL_REASON_LABELS[reason] ?? reason);

    const lines = [
        '🗑 <b>New uninstall feedback</b>',
        '',
        `📋 <b>Reasons:</b> ${reasonLabels.length > 0 ? escapeHtml(reasonLabels.join(', ')) : '<i>(none selected)</i>'}`,
        ...(feedback.missingFeatureDetails
            ? [`🔧 <b>Missing feature:</b> ${escapeHtml(feedback.missingFeatureDetails)}`]
            : []),
        ...(feedback.comment ? [`💬 <b>Comment:</b> ${escapeHtml(feedback.comment)}`] : []),
        '',
        '<b>Details</b>',
        `🏷 Version: <code>${escapeHtml(feedback.manifestVersion)}</code>`,
        `💻 OS: <code>${escapeHtml(feedback.operatingSystem)}</code>`,
        `🆔 Extension ID: <code>${escapeHtml(feedback.extensionID)}</code>`,
        `🌐 Browser: <code>${escapeHtml(feedback.browserName)}</code>`,
    ];

    return lines.join('\n');
}

export default {
    async fetch(request, env, ctx): Promise<Response> {

        console.log({
            origin: request.headers.get('Origin'),
            extensionIds: env.CHROME_EXTENSION_ID,
            allowed: isAllowedOrigin(
                request.headers.get('Origin'),
                env.CHROME_EXTENSION_ID,
            ),
        });


        const url = new URL(request.url);
        const headers = corsHeaders(request.headers.get('Origin'), env.CHROME_EXTENSION_ID);

        // Opened by the browser itself (via browser.runtime.setUninstallURL, set in
        // src/entrypoints/background.ts) when a user removes the extension. Served
        // same-origin with /feedback below, so the page's own fetch() call needs no CORS.
        if (url.pathname === '/uninstall') {
            return new Response(uninstallHtml, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
        }

        if (url.pathname === '/settings') {
            if (request.method === 'OPTIONS') {
                return new Response(null, { headers });
            }

            const userId = url.searchParams.get('user_id');

            if (!userId) {
                return Response.json(
                    { code: 400, error: 'Missing user_id' },
                    { status: 400, headers }
                );
            }

            if (request.method === 'GET') {
                const result = await env.USER_SETTINGS.prepare(`SELECT settings FROM user_settings WHERE user_id = ?`).bind(userId).first<{ settings: string }>()

                if (!result) {
                    return Response.json(null, { headers });
                }

                return Response.json(JSON.parse(result.settings), { headers });
            }

            if (request.method === "PUT") {
                const settings = await request.json();

                await env.USER_SETTINGS
                    .prepare(`
                INSERT INTO user_settings (user_id, settings, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id)
                DO UPDATE SET
                    settings = excluded.settings,
                    updated_at = excluded.updated_at
            `)
                    .bind(
                        userId,
                        JSON.stringify(settings),
                        Date.now()
                    )
                    .run();

                return Response.json(
                    { success: true },
                    { headers }
                );
            }

            return Response.json(
                { code: 405, error: 'Method not allowed' },
                { status: 405, headers }
            );
        }

        if (url.pathname === '/feedback') {
            if (request.method === 'OPTIONS') {
                return new Response(null, { headers });
            }

            if (request.method !== 'POST') {
                return Response.json({ code: 405, error: 'Method not allowed' }, { status: 405, headers });
            }

            const feedback = await request.json<Feedback>();

            const telegramResp = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: env.TELEGRAM_CHAT_ID,
                    text: formatFeedbackMessage(feedback),
                    parse_mode: 'HTML',
                }),
            });

            if (!telegramResp.ok) {
                return Response.json({ code: 502, error: 'Failed to deliver feedback' }, { status: 502, headers });
            }

            return Response.json({ code: 200, success: 'Feedback was received.' }, { headers });
        }

        return new Response('Not Found', { status: 404, headers });
    },
} satisfies ExportedHandler<Env>;
