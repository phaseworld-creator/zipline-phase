import { readFile } from 'fs/promises';
import { log } from './logger';

const logger = log('virus-scan').c('scan');

export interface ScanResult {
  clean: boolean;
  threat?: string;
  error?: string;
}

/**
 * Scan a file for malware/viruses using ClamAV or VirusTotal.
 *
 * For ClamAV: requires a ClamAV daemon running (clamd) on localhost:3310
 * For VirusTotal: requires an API key from https://virustotal.com
 */
export async function scanFile(
  filePath: string,
  provider: 'clamav' | 'virustotal' = 'clamav',
  virusTotalApiKey?: string | null,
): Promise<ScanResult> {
  if (provider === 'virustotal') {
    return scanVirusTotal(filePath, virusTotalApiKey);
  }
  return scanClamav(filePath);
}

async function scanClamav(filePath: string): Promise<ScanResult> {
  try {
    const { Socket } = await import('net');
    const buffer = await readFile(filePath);
    const socket = new Socket();

    return await new Promise<ScanResult>((resolve) => {
      socket.connect(3310, 'localhost', () => {
        socket.write('zINSTREAM\0');
        const sizeBuf = Buffer.alloc(4);
        sizeBuf.writeUInt32BE(buffer.length, 0);
        socket.write(sizeBuf);
        socket.write(buffer);
        const endBuf = Buffer.alloc(4);
        endBuf.writeUInt32BE(0, 0);
        socket.write(endBuf);
      });

      let response = '';
      socket.on('data', (data: Buffer) => {
        response += data.toString();
      });

      socket.on('error', (err) => {
        logger.warn('ClamAV connection error', { error: String(err) });
        resolve({ clean: true, error: `ClamAV unavailable: ${err.message}` });
      });

      socket.on('close', () => {
        if (response.includes('found') || response.includes('virus')) {
          const match = response.match(/(\S+ virus)/);
          resolve({ clean: false, threat: match ? match[1] : 'unknown' });
        } else if (response.includes('OK')) {
          resolve({ clean: true });
        } else if (response.includes('ERROR')) {
          resolve({ clean: true, error: 'ClamAV scan error' });
        } else {
          resolve({ clean: true });
        }
      });

      socket.setTimeout(30000, () => {
        socket.destroy();
        resolve({ clean: true, error: 'ClamAV scan timeout' });
      });
    });
  } catch (err) {
    logger.warn('ClamAV scan failed', { error: String(err) });
    return { clean: true, error: String(err) };
  }
}

async function scanVirusTotal(filePath: string, apiKey?: string | null): Promise<ScanResult> {
  if (!apiKey) {
    return { clean: true, error: 'VirusTotal API key not configured' };
  }

  try {
    const { createHash } = await import('crypto');
    const buffer = await readFile(filePath);
    const hash = createHash('sha256').update(buffer).digest('hex');

    // Check by hash first
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.ok) {
      const json = (await res.json()) as any;
      const stats = json.data?.attributes?.last_analysis_stats;
      if (stats && stats.malicious > 0) {
        return { clean: false, threat: `malicious (${stats.malicious} engines)` };
      }
      return { clean: true };
    }

    // File not found in VT database, upload it
    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob);

    const uploadRes = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: { 'x-apikey': apiKey },
      body: formData,
    });

    if (!uploadRes.ok) {
      return { clean: true, error: `VirusTotal upload failed: ${uploadRes.status}` };
    }

    const uploadJson = (await uploadRes.json()) as any;
    const analysisId = uploadJson.data?.id;

    if (!analysisId) {
      return { clean: true, error: 'VirusTotal no analysis ID' };
    }

    // Poll for results
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const analysisRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': apiKey },
      });

      if (analysisRes.ok) {
        const analysisJson = (await analysisRes.json()) as any;
        const stats = analysisJson.data?.attributes?.stats;
        if (stats && stats.malicious > 0) {
          return { clean: false, threat: `malicious (${stats.malicious} engines)` };
        }
        if (stats && stats.completed > 0) {
          return { clean: true };
        }
      }
    }

    return { clean: true, error: 'VirusTotal scan timeout' };
  } catch (err) {
    logger.warn('VirusTotal scan failed', { error: String(err) });
    return { clean: true, error: String(err) };
  }
}
