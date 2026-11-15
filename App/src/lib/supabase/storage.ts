import { SupabaseClient } from '@supabase/supabase-js';

// Files live under a folder named after their owner's id (<user id>/<file>),
// which is what the storage policies check. See
// supabase/migrations/20261115000001_avatar_and_resume_files.sql.

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const RESUME_FILE_BUCKET = 'resume-files';
export const RESUME_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const RESUME_FILE_MAX_BYTES = 5 * 1024 * 1024;

const PROFILE_FIELDS = `first_name, last_name, email, phone, postal_code, account_type, avatar_url`;

/** Throws a readable error when a file has the wrong type or is too large. */
export function checkFile(file: File, types: string[], maxBytes: number, kind: string) {
    if (!types.includes(file.type)) throw new Error(`This file type is not allowed for ${kind}.`);
    if (file.size > maxBytes) {
        throw new Error(
            `The file is too large; ${kind} must be under ${maxBytes / 1024 / 1024} MB.`,
        );
    }
}

async function currentUserId(client: SupabaseClient) {
    const { data, error } = await client.auth.getClaims();
    const userId = data?.claims?.sub;
    if (error || !userId) throw new Error('You must be logged in.');
    return userId as string;
}

/** A unique object path in the user's folder that keeps the file's extension. */
function objectPath(userId: string, fileName: string) {
    const extension = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
    return `${userId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
}

/** The object path inside the avatars bucket for a public avatar URL, if it is one. */
function avatarPath(url: string | null | undefined) {
    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    return url?.includes(marker) ? decodeURIComponent(url.split(marker)[1]) : null;
}

/** Uploads a new avatar, points the profile at it and removes the previous one. */
export async function uploadAvatar(client: SupabaseClient, file: File, previousUrl?: string) {
    checkFile(file, AVATAR_TYPES, AVATAR_MAX_BYTES, 'a picture');
    const userId = await currentUserId(client);
    const path = objectPath(userId, file.name);

    const upload = await client.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { contentType: file.type });
    if (upload.error) throw new Error(upload.error.message);

    const avatarUrl = client.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
    const profile = await setAvatarUrl(client, userId, avatarUrl);

    await removeAvatarFile(client, previousUrl);
    return profile;
}

/** Clears the profile's avatar, so it falls back to the initials. */
export async function removeAvatar(client: SupabaseClient, previousUrl?: string) {
    const profile = await setAvatarUrl(client, await currentUserId(client), null);
    await removeAvatarFile(client, previousUrl);
    return profile;
}

async function setAvatarUrl(client: SupabaseClient, userId: string, avatarUrl: string | null) {
    const { data, error } = await client
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date() })
        .eq('id', userId)
        .select(PROFILE_FIELDS)
        .single();
    if (error || !data) throw new Error(error?.message ?? 'Failed to update the picture.');
    return data;
}

async function removeAvatarFile(client: SupabaseClient, url?: string) {
    const path = avatarPath(url);
    // A failed clean-up only leaves an unused file behind.
    if (path) await client.storage.from(AVATAR_BUCKET).remove([path]);
}

/** Uploads a resume file and creates a Draft resume for it, named after the file. */
export async function uploadResumeFile(client: SupabaseClient, file: File) {
    checkFile(file, RESUME_FILE_TYPES, RESUME_FILE_MAX_BYTES, 'resume files');
    const userId = await currentUserId(client);
    const path = objectPath(userId, file.name);

    const upload = await client.storage
        .from(RESUME_FILE_BUCKET)
        .upload(path, file, { contentType: file.type });
    if (upload.error) throw new Error(upload.error.message);

    const title = file.name.replace(/\.[^.]+$/, '').trim() || 'Uploaded resume';
    const { error } = await client
        .from('resumes')
        .insert({ user_id: userId, title, file_path: path, file_name: file.name });

    if (error) {
        await client.storage.from(RESUME_FILE_BUCKET).remove([path]);
        throw new Error(error.message);
    }
}

/** Replaces (or attaches) the file of an existing resume. */
export async function replaceResumeFile(
    client: SupabaseClient,
    resumeId: string,
    file: File,
    previousPath?: string | null,
) {
    checkFile(file, RESUME_FILE_TYPES, RESUME_FILE_MAX_BYTES, 'resume files');
    const userId = await currentUserId(client);
    const path = objectPath(userId, file.name);

    const upload = await client.storage
        .from(RESUME_FILE_BUCKET)
        .upload(path, file, { contentType: file.type });
    if (upload.error) throw new Error(upload.error.message);

    const { error } = await client
        .from('resumes')
        .update({ file_path: path, file_name: file.name, updated_at: new Date() })
        .eq('id', resumeId);

    if (error) {
        await client.storage.from(RESUME_FILE_BUCKET).remove([path]);
        throw new Error(error.message);
    }
    if (previousPath) await client.storage.from(RESUME_FILE_BUCKET).remove([previousPath]);
}

/** Deletes a resume and its file, unless it was sent with an application. */
export async function deleteResume(
    client: SupabaseClient,
    resumeId: string,
    filePath?: string | null,
) {
    const { error, count } = await client
        .from('resumes')
        .delete({ count: 'exact' })
        .eq('id', resumeId);
    if (error) throw new Error(error.message);
    // Row security hides the row from the delete when it was sent with an
    // application; recruiters still need to read those.
    if (count === 0) {
        throw new Error('This resume was sent with an application, so it cannot be deleted.');
    }

    if (filePath) await client.storage.from(RESUME_FILE_BUCKET).remove([filePath]);
}

/** Short-lived links to resume files, by path. Paths the user cannot read are left out. */
export async function resumeFileLinks(
    client: SupabaseClient,
    paths: string[],
): Promise<Record<string, string>> {
    if (paths.length === 0) return {};

    const { data } = await client.storage.from(RESUME_FILE_BUCKET).createSignedUrls(paths, 60 * 60);
    return Object.fromEntries(
        (data ?? [])
            .filter((link) => link.signedUrl && link.path)
            .map((link) => [link.path!, link.signedUrl as string]),
    );
}
