import * as Limiter from 'ratelimiter';
import limiterDB from '../../db/redis';
import { IEndpointMeta } from './endpoints';
import { User } from '../../models/entities/user';
import Logger from '../../services/logger';

const logger = new Logger('limiter');

export const limiter = (limitation: IEndpointMeta['limit'] & { key: NonNullable<string> }, actor: string) => new Promise<void>((ok, reject) => {
	const hasShortTermLimit = typeof limitation.minInterval === 'number';

	const hasLongTermLimit =
		typeof limitation.duration === 'number' &&
		typeof limitation.max === 'number';

	if (hasShortTermLimit) {
		min();
	} else if (hasLongTermLimit) {
		max();
	} else {
		ok();
	}

	// Short-term limit
	function min() {
		const minIntervalLimiter = new Limiter({
			id: `${actor}:${limitation.key}:min`,
			duration: limitation.minInterval,
			max: 1,
			db: limiterDB!
		});

		minIntervalLimiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			logger.debug(`${actor} ${limitation.key} min remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('BRIEF_REQUEST_INTERVAL');
			} else {
				if (hasLongTermLimit) {
					max();
				} else {
					ok();
				}
			}
		});
	}

	// Long term limit
	function max() {
		const limiter = new Limiter({
			id: `${actor}:${limitation.key}`,
			duration: limitation.duration,
			max: limitation.max,
			db: limiterDB!
		});

		limiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			logger.debug(`${actor} ${limitation.key} max remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('RATE_LIMIT_EXCEEDED');
			} else {
				ok();
			}
		});
	}
});
