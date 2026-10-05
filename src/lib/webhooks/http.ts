import { Config } from '../config/validate';
import { log } from '../logger';
import { onUpload as discordOnUpload, onShorten as discordOnShorten } from './discord';

const logger = log('webhooks').c('http');

export async function onUpload(config: Config, { user, file, link }: Parameters<typeof discordOnUpload>[1]) {
  if (!config.httpWebhook.onUpload) return;
  if (!URL.canParse(config.httpWebhook.onUpload)) {
    logger.debug('invalid url for http onUpload');
    return;
  }

  const { oauthProviders: _oauthProviders, passkeys: _passkeys, ...safeUser } = user;
  const { password: _password, ...safeFile } = file;

  const payload = {
    type: 'upload',
    data: {
      user: safeUser,
      file: safeFile,
      link,
    },
  };

  try {
    const res = await fetch(config.httpWebhook.onUpload, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-zipline-webhook': 'true',
        'x-zipline-webhook-type': 'upload',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('webhook failed', { response: text, status: res.status });
    } else {
      logger.info('http upload webhook sent successfully', { status: res.status });
    }
  } catch (e) {
    logger.error('error while sending webhook', { error: (e as TypeError).message });
  }

  return;
}

export async function onShorten(config: Config, { user, url, link }: Parameters<typeof discordOnShorten>[1]) {
  if (!config.httpWebhook.onShorten) return;
  if (!URL.canParse(config.httpWebhook.onShorten)) {
    logger.debug('invalid url for http onShorten');
    return;
  }

  const { oauthProviders: _oauthProviders, passkeys: _passkeys, ...safeUser } = user;
  const { password: _password, ...safeUrl } = url;

  const payload = {
    type: 'shorten',
    data: {
      user: safeUser,
      url: safeUrl,
      link,
    },
  };
  try {
    const res = await fetch(config.httpWebhook.onShorten, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-zipline-webhook': 'true',
        'x-zipline-webhook-type': 'shorten',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('webhook failed', { response: text, status: res.status });
    } else {
      logger.info('http shorten webhook sent successfully', { status: res.status });
    }
  } catch (e) {
    logger.error('error while sending webhook', { error: (e as TypeError).message });
  }

  return;
}

export async function onDelete(
  config: Config,
  { user, file }: { user: import('../db/models/user').User; file: { id: string; name: string; type: string; size: number } },
) {
  const url = config.httpWebhook?.onDelete;
  if (!url || !URL.canParse(url)) return;

  const { oauthProviders: _op, passkeys: _pk, ...safeUser } = user;
  const payload = { type: 'delete', data: { user: safeUser, file } };

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-zipline-webhook': 'true',
        'x-zipline-webhook-type': 'delete',
      },
    });
    if (!res.ok) logger.error('http delete webhook failed', { status: res.status });
  } catch (e) {
    logger.error('http delete webhook error', { error: (e as Error).message });
  }
}

export async function onSignup(
  config: Config,
  { user }: { user: { id: string; username: string; createdAt: Date | string } },
) {
  const url = config.httpWebhook?.onSignup;
  if (!url || !URL.canParse(url)) return;

  const payload = { type: 'signup', data: { user } };

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-zipline-webhook': 'true',
        'x-zipline-webhook-type': 'signup',
      },
    });
    if (!res.ok) logger.error('http signup webhook failed', { status: res.status });
  } catch (e) {
    logger.error('http signup webhook error', { error: (e as Error).message });
  }
}
