export interface EncryptedPayload {
  iv: string;
  data: string;
  algorithm: string;
}

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importKey(rawKey: string): Promise<CryptoKey> {
  const binary = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    binary,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptFile(file: File): Promise<{ encrypted: ArrayBuffer; key: string; iv: string }> {
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new Uint8Array(await file.arrayBuffer());

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  return {
    encrypted,
    key: await exportKey(key),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptFile(
  encryptedData: ArrayBuffer,
  keyString: string,
  ivString: string,
): Promise<ArrayBuffer> {
  const key = await importKey(keyString);
  const iv = Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0));

  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
