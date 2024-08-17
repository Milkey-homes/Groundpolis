import * as ms from 'ms';
import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import create from '../../../../../services/drive/add-file';
import define from '../../../define';
import { apiLogger } from '../../../logger';
import { ApiError } from '../../../error';
import { DriveFiles } from '../../../../../models';
import { IdentifiableError } from '../../../../../misc/identifiable-error';

export const meta = {
	desc: {
		'ja-JP': 'ドライブにファイルをアップロードします。',
		'en-US': 'Upload a file to drive.'
	},

	tags: ['drive'],

	requireCredential: true as const,

	limit: {
		duration: ms('1hour'),
		max: 120
	},

	requireFile: true,

	kind: 'write:drive',

	params: {
		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},

		name: {
			validator: $.optional.nullable.str,
			default: null as any,
			desc: {
				'ja-JP': 'ファイル名（拡張子があるなら含めて）'
			}
		},

		isSensitive: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'このメディアが「閲覧注意」(NSFW)かどうか',
				'en-US': 'Whether this media is NSFW'
			}
		},

		force: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'true にすると、同じハッシュを持つファイルが既にアップロードされていても強制的にファイルを作成します。',
			}
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'DriveFile',
	},

	errors: {
		invalidFileName: {
			message: 'Invalid file name.',
			code: 'INVALID_FILE_NAME',
			id: 'f449b209-0c60-4e51-84d5-29486263bfd4'
		},

		noFreeSpace: {
			message: 'Cannot upload the file because you have no free space of drive.',
			code: 'NO_FREE_SPACE',
			id: 'd08dbc37-a6a9-463a-8c47-96c32ab5f064',
		},
	}
};

export default define(meta, async (ps, user, _, file, cleanup) => {
	// Get 'name' parameter
	let name = ps.name || file.originalname;
	if (name !== undefined && name !== null) {
		name = name.trim();
		if (name.length === 0) {
			name = null;
		} else if (name === 'blob') {
			name = null;
		} else if (!DriveFiles.validateFileName(name)) {
			throw new ApiError(meta.errors.invalidFileName);
		}
	} else {
		name = null;
	}

	try {
		// Create file
		const driveFile = await create(user, file.path, name, null, ps.folderId, ps.force, false, null, null, ps.isSensitive);
		return await DriveFiles.pack(driveFile, { self: true });
	} catch (e) {
		if (e instanceof Error || typeof e === 'string') {
			apiLogger.error(e);
		}
		if (e instanceof IdentifiableError) {
			if (e.id === 'c6244ed2-a39a-4e1c-bf93-f0fbd7764fa6') throw new ApiError(meta.errors.noFreeSpace);
		}
		throw new ApiError();
	} finally {
		cleanup!();
	}
});
