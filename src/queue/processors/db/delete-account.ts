import * as Bull from 'bull';
import { queueLogger } from '../../logger';
import { DriveFiles, Notes, Users, FollowRequests, Followings } from '../../../models/index';
import { DbUserJobData } from '../../../queue/types';
import { Note } from '../../../models/entities/note';
import { DriveFile } from '../../../models/entities/drive-file';
import { MoreThan } from 'typeorm';
import { deleteFileSync } from '../../../services/drive/delete-file';
import deleteFollowing from '../../../services/following/delete';
import cancelFollowRequest from '../../../services/following/requests/cancel';
import rejectFollowRequest from '../../../services/following/requests/reject';

const logger = queueLogger.createSubLogger('delete-account');

export async function deleteAccount(job: Bull.Job<DbUserJobData>): Promise<string | void> {
	logger.info(`Deleting account of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		return;
	}

	{ // Reject Follows
		// When deleting a remote account, the account obviously doesn't
		// actually become deleted on its origin server, i.e. unlike a
		// locally deleted account it continues to have access to its home
		// feed and other content. To prevent it from being able to continue
		// to access toots it would receive because it follows local accounts,
		// we have to force it to unfollow them.

		if (!Users.isLocalUser(job.data.user)) {
			const follower = user;

			const followings = await Followings.find({
				followerId: follower.id,
			});

			for (const following of followings) {
				const followee = await Users.findOne({
					id: following.followeeId,
				});

				if (followee != null) {
					await deleteFollowing(follower, followee, true);
				}
			}

			const requests = await FollowRequests.find({
				followerId: follower.id,
			});

			for (const request of requests) {
				const followee = await Users.findOne(request.followeeId);

				if (followee != null) {
					await rejectFollowRequest(followee, follower);
				}
			}
		}
	}

	{ // Undo Follows
		// When deleting a remote account, the account obviously doesn't
    // actually become deleted on its origin server, but following relationships
    // are severed on our end. Therefore, make the remote server aware that the
    // follow relationships are severed to avoid confusion and potential issues
    // if the remote account gets un-suspended.

		if (!Users.isLocalUser(job.data.user)) {
			const followee = user;

			const followers = await Followings.find({
				followeeId: followee.id,
			});

			for (const following of followers) {
				const follower = await Users.findOne({
					id: following.followerId,
				});

				if (follower != null) {
					await deleteFollowing(follower, followee, true);
				}
			}

			const requests = await FollowRequests.find({
				followeeId: followee.id,
			});

			for (const request of requests) {
				const follower = await Users.findOne(request.followerId);

				if (follower != null) {
					await cancelFollowRequest(followee, follower);
				}
			}
		}
	}

	{ // Delete notes
		let cursor: Note['id'] | null = null;

		while (true) {
			const notes = await Notes.find({
				where: {
					userId: user.id,
					...(cursor ? { id: MoreThan(cursor) } : {})
				},
				take: 100,
				order: {
					id: 1
				}
			});

			if (notes.length === 0) {
				break;
			}

			cursor = notes[notes.length - 1].id;

			await Notes.delete(notes.map(note => note.id));
		}

		logger.succ(`All of notes deleted`);
	}

	{ // Delete files
		let cursor: DriveFile['id'] | null = null;

		while (true) {
			const files = await DriveFiles.find({
				where: {
					userId: user.id,
					...(cursor ? { id: MoreThan(cursor) } : {})
				},
				take: 10,
				order: {
					id: 1
				}
			});

			if (files.length === 0) {
				break;
			}

			cursor = files[files.length - 1].id;

			for (const file of files) {
				await deleteFileSync(file);
			}
		}

		logger.succ(`All of files deleted`);
	}

	await Users.delete(job.data.user.id);

	return 'Account deleted';
}
