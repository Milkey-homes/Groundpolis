import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import * as ms from 'ms';
import { publishMainStream } from '../../../services/stream';
import define from '../define';
import { Users, UserProfiles, PasswordResetRequests } from '../../../models';
import { ApiError } from '../error';

export const meta = {
	tags: ['reset password'],

	requireCredential: false as const,

	limit: {
		duration: ms('1hour'),
		max: 3
	},

	params: {
		token: {
			validator: $.str
		},

		password: {
			validator: $.str
		}
	},

	errors: {
		noSuchResetRequest: {
			message: 'No such reset request.',
			code: 'NO_SUCH_RESET_REQUEST',
			id: '6382759d-294c-43de-89b3-4e825006ca43',
		}
	}
};

export default define(meta, async (ps, user) => {
	const req = await PasswordResetRequests.findOne({
		token: ps.token,
	});
	if (req == null) throw new ApiError(meta.errors.noSuchResetRequest);

	// 発行してから30分以上経過していたら無効
	// expires after 30 minutes
	// This is a secondary check just in case the expiry task is broken,
	// the expiry task is badly aligned with this expiration or something
	// else strange is going on.
	if (Date.now() - req.createdAt.getTime() > 1000 * 60 * 30) {
		await PasswordResetRequests.delete(req.id);
		if (req == null) throw new ApiError(meta.errors.noSuchResetRequest);
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(ps.password, salt);

	await UserProfiles.update(req.userId, {
		password: hash
	});

	await PasswordResetRequests.delete(req.id);
});
