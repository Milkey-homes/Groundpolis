import * as Queue from 'bull';

import config from '../config';
import { ILocalUser } from '../models/entities/user';
import { program } from '../argv';

import processDb from './processors/db';
import procesObjectStorage from './processors/object-storage';
import { queueLogger } from './logger';
import { DriveFile } from '../models/entities/drive-file';
<<<<<<< HEAD
import { getJobInfo } from './get-job-info';
import { IActivity } from '../remote/activitypub/type';
import { ThinUser } from './types';
=======
>>>>>>> 5819cf375277c06540c217ca14e69d9cf55e5109

function initializeQueue(name: string, limitPerSec = -1) {
	return new Queue(name, {
		redis: {
			port: config.redis.port,
			host: config.redis.host,
			password: config.redis.pass,
			db: config.redis.db || 0,
		},
		prefix: config.redis.prefix ? `${config.redis.prefix}:queue` : 'queue',
		limiter: limitPerSec > 0 ? {
			max: limitPerSec * 5,
			duration: 5000
		} : undefined
	});
}

export type InboxJobData = {
	activity: IActivity,
	/** HTTP-Signature */
	signature: httpSignature.IParsedSignature
};

function renderError(e: Error): any {
	return {
		stack: e?.stack,
		message: e?.message,
		name: e?.name
	};
}

export const dbQueue = initializeQueue('db');
export const objectStorageQueue = initializeQueue('objectStorage');

const dbLogger = queueLogger.createSubLogger('db');
const objectStorageLogger = queueLogger.createSubLogger('objectStorage');

dbQueue
	.on('waiting', (jobId) => dbLogger.debug(`waiting id=${jobId}`))
	.on('active', (job) => dbLogger.debug(`active id=${job.id}`))
	.on('completed', (job, result) => dbLogger.debug(`completed(${result}) id=${job.id}`))
	.on('failed', (job, err) => dbLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
	.on('error', (job: any, err: Error) => dbLogger.error(`error ${err}`, { job, e: renderError(err) }))
	.on('stalled', (job) => dbLogger.warn(`stalled id=${job.id}`));

objectStorageQueue
	.on('waiting', (jobId) => objectStorageLogger.debug(`waiting id=${jobId}`))
	.on('active', (job) => objectStorageLogger.debug(`active id=${job.id}`))
	.on('completed', (job, result) => objectStorageLogger.debug(`completed(${result}) id=${job.id}`))
	.on('failed', (job, err) => objectStorageLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
	.on('error', (job: any, err: Error) => objectStorageLogger.error(`error ${err}`, { job, e: renderError(err) }))
	.on('stalled', (job) => objectStorageLogger.warn(`stalled id=${job.id}`));

<<<<<<< HEAD
export function deliver(user: ILocalUser, content: any, to: any) {
	if (content == null) return null;

	const data = {
		user: {
			id: user.id
		},
		content,
		to
	};

	return deliverQueue.add(data, {
		attempts: config.deliverJobMaxAttempts || 12,
		backoff: {
			type: 'exponential',
			delay: 60 * 1000
		},
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function inbox(activity: any, signature: httpSignature.IParsedSignature) {
	const data = {
		activity: activity,
		signature
	};

	return inboxQueue.add(data, {
		attempts: config.inboxJobMaxAttempts || 8,
		backoff: {
			type: 'exponential',
			delay: 60 * 1000
		},
		removeOnComplete: true,
		removeOnFail: true
	});
}

=======
>>>>>>> 5819cf375277c06540c217ca14e69d9cf55e5109
export function createDeleteDriveFilesJob(user: ILocalUser) {
	return dbQueue.add('deleteDriveFiles', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportNotesJob(user: ILocalUser) {
	return dbQueue.add('exportNotes', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportFollowingJob(user: ILocalUser) {
	return dbQueue.add('exportFollowing', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportMuteJob(user: ILocalUser) {
	return dbQueue.add('exportMute', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportBlockingJob(user: ILocalUser) {
	return dbQueue.add('exportBlocking', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportUserListsJob(user: ILocalUser) {
	return dbQueue.add('exportUserLists', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportFollowingJob(user: ILocalUser, fileId: DriveFile['id']) {
	return dbQueue.add('importFollowing', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportMutingJob(user: ThinUser, fileId: DriveFile['id']) {
	return dbQueue.add('importMuting', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportBlockingJob(user: ThinUser, fileId: DriveFile['id']) {
	return dbQueue.add('importBlocking', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportUserListsJob(user: ThinUser, fileId: DriveFile['id']) {
	return dbQueue.add('importUserLists', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteAccountJob(user: ThinUser) {
	return dbQueue.add('deleteAccount', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteObjectStorageFileJob(key: string) {
	return objectStorageQueue.add('deleteFile', {
		key: key
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createCleanRemoteFilesJob() {
	return objectStorageQueue.add('cleanRemoteFiles', {}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export default function() {
	if (!program.onlyServer) {
		processDb(dbQueue);
		procesObjectStorage(objectStorageQueue);
	}
}

export function destroy() {
	// nop
}
