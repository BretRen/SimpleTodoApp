const SALT_BYTES = 16;
const IV_BYTES = 12;
const GCM_TAG_BYTES = 16;
const PBKDF2_ITERATIONS = 600000;
const LEGACY_ITERATIONS = 100000;

export type EncryptedEnvelope = {
    e: true;
    salt: string;
    data: string;
};

export type LegacyEnvelope = {
    e: true;
    data: string;
};

export function isEncryptedEnvelope(
    value: unknown,
): value is EncryptedEnvelope {
    if (typeof value !== "object" || value === null) return false;
    const envelope = value as EncryptedEnvelope;
    return (
        envelope.e === true &&
        typeof envelope.salt === "string" &&
        typeof envelope.data === "string"
    );
}

export function isLegacyEnvelope(value: unknown): value is LegacyEnvelope {
    if (isEncryptedEnvelope(value)) return false;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }
    const envelope = value as LegacyEnvelope;
    return envelope.e === true && typeof envelope.data === "string";
}

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export function randomSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

export async function deriveKey(
    password: string,
    salt: Uint8Array,
    iterations = PBKDF2_ITERATIONS,
) {
    const saltBuffer = new ArrayBuffer(salt.byteLength);
    new Uint8Array(saltBuffer).set(salt);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: saltBuffer,
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    );
}

export async function encryptWithKey(plaintext: string, key: CryptoKey) {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(plaintext),
    );

    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), iv.length);
    return bytesToBase64(result);
}

export async function decryptWithKey(payload: string, key: CryptoKey) {
    const data = base64ToBytes(payload);
    if (data.length < IV_BYTES + GCM_TAG_BYTES) {
        throw new Error("Ciphertext is too short");
    }

    const iv = data.slice(0, IV_BYTES);
    const ciphertext = data.slice(IV_BYTES);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext,
    );

    return new TextDecoder().decode(decrypted);
}

export async function decryptLegacy(payload: string, password: string) {
    const data = base64ToBytes(payload);
    if (data.length < SALT_BYTES + IV_BYTES + GCM_TAG_BYTES) {
        throw new Error("Ciphertext is too short");
    }

    const salt = data.slice(0, SALT_BYTES);
    const iv = data.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ciphertext = data.slice(SALT_BYTES + IV_BYTES);
    const key = await deriveKey(password, salt, LEGACY_ITERATIONS);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext,
    );

    return new TextDecoder().decode(decrypted);
}

export async function encryptStorage(
    plaintext: string,
    key: CryptoKey,
    salt: Uint8Array,
): Promise<string> {
    const envelope: EncryptedEnvelope = {
        e: true,
        salt: bytesToBase64(salt),
        data: await encryptWithKey(plaintext, key),
    };
    return JSON.stringify(envelope);
}

export function parseStorage(saved: string): EncryptedEnvelope | null {
    try {
        const parsed: unknown = JSON.parse(saved);
        return isEncryptedEnvelope(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function parseLegacyStorage(saved: string): LegacyEnvelope | null {
    try {
        const parsed: unknown = JSON.parse(saved);
        return isLegacyEnvelope(parsed) ? parsed : null;
    } catch {
        return null;
    }
}
