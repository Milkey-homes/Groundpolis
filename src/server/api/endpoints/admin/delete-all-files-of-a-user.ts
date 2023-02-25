import $ from 'cafy';
import define from '../../define';
import { deleteFile } from '../../../../services/drive/delete-file';
import { DriveFiles, Users } from '../../../../models';
import { ID } from '../../../../misc/cafy-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to suspend'
			}
		},
	}
};

export default define(meta, async (ps, me) => {
	const files = await DriveFiles.find({
		userId: ps.userId
	});

	const user = await Users.findOne(ps.userId as string);

	if (user.isAdmin) {
		throw new Error('cannot delete files of admin');
	}

	if (me.isModerator && user.isModerator) {
		throw new Error('cannot delete files of moderator');
	}

	for (const file of files) {
		deleteFile(file);
	}
});
