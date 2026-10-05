import { Config } from '../config/validate';
import { log } from '../logger';
import {
  onUpload as discordOnUpload,
  onShorten as discordOnShorten,
  onDelete as discordOnDelete,
  onSignup as discordOnSignup,
} from './discord';
import {
  onUpload as httpOnUpload,
  onShorten as httpOnShorten,
  onDelete as httpOnDelete,
  onSignup as httpOnSignup,
} from './http';
import type { User } from '../db/models/user';
import type { File } from '../db/models/file';

const logger = log('webhooks');

export function onUpload(config: Config, args: Parameters<typeof discordOnUpload>[1]) {
  void Promise.all([discordOnUpload(config, args), httpOnUpload(config, args)]).catch((error) =>
    logger.error('upload webhook failed', { error: error instanceof Error ? error.message : error }),
  );
}

export function onShorten(config: Config, args: Parameters<typeof discordOnShorten>[1]) {
  void Promise.all([discordOnShorten(config, args), httpOnShorten(config, args)]).catch((error) =>
    logger.error('shorten webhook failed', { error: error instanceof Error ? error.message : error }),
  );
}

export function onDelete(config: Config, args: { user: User; file: Pick<File, 'id' | 'name' | 'type' | 'size'> }) {
  void Promise.all([discordOnDelete(config, args), httpOnDelete(config, args)]).catch((error) =>
    logger.error('delete webhook failed', { error: error instanceof Error ? error.message : error }),
  );
}

export function onSignup(config: Config, args: { user: Pick<User, 'id' | 'username' | 'createdAt'> }) {
  void Promise.all([discordOnSignup(config, args), httpOnSignup(config, args)]).catch((error) =>
    logger.error('signup webhook failed', { error: error instanceof Error ? error.message : error }),
  );
}
