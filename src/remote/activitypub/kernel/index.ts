import { IObject, isCreate, isDelete, isUpdate, isRead, isFollow, isAccept, isReject, isAdd, isRemove, isAnnounce, isLike, isUndo, isBlock, isCollectionOrOrderedCollection, isCollection, isFlag } from '../type';
import { IRemoteUser } from '../../../models/entities/user';
import create from './create';
import performDeleteActivity from './delete';
import performUpdateActivity from './update';
import { performReadActivity } from './read';
import follow from './follow';
import undo from './undo';
import like from './like';
import announce from './announce';
import accept from './accept';
import reject from './reject';
import add from './add';
import remove from './remove';
import block from './block';
import flag from './flag';
import { apLogger } from '../logger';
import Resolver from '../resolver';
import { toArray } from '../../../prelude/array';

export async function performActivity(actor: IRemoteUser, activity: IObject) {
	if (isCollectionOrOrderedCollection(activity)) {
		apLogger.debug(`Refusing to ingest collection as activity`);
		return;
	} else {
		await performOneActivity(actor, activity);
	}
}

async function performOneActivity(actor: IRemoteUser, activity: IObject): Promise<void> {
	if (actor.isSuspended) return;

	if (isCreate(activity)) {
		await create(actor, activity);
	} else if (isDelete(activity)) {
		await performDeleteActivity(actor, activity);
	} else if (isUpdate(activity)) {
		await performUpdateActivity(actor, activity);
	} else if (isRead(activity)) {
		await performReadActivity(actor, activity);
	} else if (isFollow(activity)) {
		await follow(actor, activity);
	} else if (isAccept(activity)) {
		await accept(actor, activity);
	} else if (isReject(activity)) {
		await reject(actor, activity);
	} else if (isAdd(activity)) {
		await add(actor, activity).catch(err => apLogger.error(err));
	} else if (isRemove(activity)) {
		await remove(actor, activity).catch(err => apLogger.error(err));
	} else if (isAnnounce(activity)) {
		await announce(actor, activity);
	} else if (isLike(activity)) {
		await like(actor, activity);
	} else if (isUndo(activity)) {
		await undo(actor, activity);
	} else if (isBlock(activity)) {
		await block(actor, activity);
	} else if (isFlag(activity)) {
		await flag(actor, activity);
	} else {
		apLogger.warn(`unrecognized activity type: ${(activity as any).type}`);
	}
}
