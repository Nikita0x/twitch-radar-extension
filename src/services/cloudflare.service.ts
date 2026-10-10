import { getUserSettings, saveUserSettings } from "@/services/storage.service";
import type { UserSettings } from "@/services/storage.service";
import { request } from "@/types/result";

// The worker identifies the user from the Twitch token (validated server-side
// against Twitch), so no user_id is sent — a client can only touch its own row.
export async function getUserSettingsFromDatabase(accessToken: string) {
    const result = await request<UserSettings | null>(`${import.meta.env.WXT_WORKER_URL}/settings`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!result.ok) {
        console.error(result.error)
        return null
    }

    return result.data
}

export async function putUserSettings(accessToken: string, settings: UserSettings) {
    const result = await request<UserSettings>(
        `${import.meta.env.WXT_WORKER_URL}/settings`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(settings),
        }
    );

    if (!result.ok) {
        console.error(result.error);
        return result.error;
    }

    return result.data
}

export async function syncSettings(accessToken: string) {
    const localSettings = await getUserSettings();

    const remoteSettings =
        await getUserSettingsFromDatabase(accessToken);

    if (!remoteSettings) {
        await putUserSettings(accessToken, localSettings);
        return;
    }

    await saveUserSettings(remoteSettings);
}
