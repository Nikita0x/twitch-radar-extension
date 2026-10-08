import { getUserSettings, saveUserSettings } from "@/services/storage.service";
import type { UserSettings } from "@/services/storage.service";
import { request } from "@/types/result";

export async function getUserSettingsFromDatabaseByUserId(userId: string) {
    const result = await request<UserSettings>(`${import.meta.env.WXT_WORKER_URL}/settings?user_id=${userId}`, {
        method: 'GET',
    });

    if (!result.ok) {
        console.error(result.error)
        return null
    }

    console.log(result.data)

    return result.data
}

export async function putUserSettings(userId: string, settings: UserSettings) {
    const result = await request<UserSettings>(
        `${import.meta.env.WXT_WORKER_URL}/settings?user_id=${userId}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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

export async function syncSettings(userId: string) {
    const localSettings = await getUserSettings();

    const remoteSettings =
        await getUserSettingsFromDatabaseByUserId(userId);

    if (!remoteSettings) {
        await putUserSettings(userId, localSettings);
        return;
    }

    await saveUserSettings(remoteSettings);
}