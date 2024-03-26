import config from '../../config';
import { ILocalUser } from '../../models/entities/user';
import { getInstanceActor } from '../../services/instance-actor';
import { apGet } from './request';
import { IObject, isCollectionOrOrderedCollection, ICollection, IOrderedCollection } from './type';
import { FollowRequests, Notes, NoteReactions, Polls, Users } from '../../models';
import { parseUri } from './db-resolver';
import { fetchMeta } from '../../misc/fetch-meta';
import { extractDbHost, isSelfHost } from '../../misc/convert-host';
import renderNote from './renderer/note';
import { renderLike } from './renderer/like';
import { renderPerson } from './renderer/person';
import renderQuestion from './renderer/question';
import renderCreate from './renderer/create';
import { renderActivity } from './renderer/index';
import renderFollow from './renderer/follow';
import { IsNull, Not } from 'typeorm';

export default class Resolver {
	private history: Set<string>;
	private user?: ILocalUser;
	private recursionLimit?: number;

	constructor(recursionLimit = 100) {
		this.history = new Set();
		this.recursionLimit = recursionLimit;
	}

	public getHistory(): string[] {
		return Array.from(this.history);
	}

	public async resolveCollection(value: string | IObject): Promise<ICollection | IOrderedCollection> {
		const collection = typeof value === 'string'
			? await this.resolve(value)
			: value;

		if (isCollectionOrOrderedCollection(collection)) {
			return collection;
		} else {
			throw new Error(`unrecognized collection type: ${collection.type}`);
		}
	}

	public async resolve(value: string | IObject): Promise<IObject> {
		if (value == null) {
			throw new Error('resolvee is null (or undefined)');
		}

		if (typeof value !== 'string') {
			return value;
		}

		if (value.includes('#')) {
			// URLs with fragment parts cannot be resolved correctly because
			// the fragment part does not get transmitted over HTTP(S).
			// Avoid strange behaviour by not trying to resolve these at all.
			throw new Error(`cannot resolve URL with fragment: ${value}`);
		}

		if (this.history.has(value)) {
			throw new Error('cannot resolve already resolved one');
		}

		if (this.recursionLimit && this.history.size > this.recursionLimit) {
			throw new Error('hit recursion limit');
		}

		this.history.add(value);

		const host = extractDbHost(value);
		if (isSelfHost(host)) {
			return await this.resolveLocal(value);
		}

		const meta = await fetchMeta();
		if (meta.blockedHosts.includes(host)) {
			throw new Error('Instance is blocked');
		}

		if (config.signToActivityPubGet && !this.user) {
			this.user = await getInstanceActor();
		}

		const object = await apGet(value, this.user);

		if (object == null || (
			Array.isArray(object['@context']) ?
				!object['@context'].includes('https://www.w3.org/ns/activitystreams') :
				object['@context'] !== 'https://www.w3.org/ns/activitystreams'
		)) {
			throw new Error('invalid response');
		}

		return object;
	}

	private async resolveLocal(url: string): Promise<IObject> {
		const parsed = parseUri(url);
		if (!parsed.local) throw new Error('resolveLocal: not local');

		switch (parsed.type) {
			case 'notes':
				const note = await Notes.findOneOrFail({ id: parsed.id });
				if (parsed.rest === 'activity') {
					// this refers to the create activity and not the note itself
					return renderActivity(renderCreate(renderNote(note), note));
				} else {
					return renderNote(note);
				}
			case 'users':
				const user = await Users.findOneOrFail({ id: parsed.id });
				return await renderPerson(user as ILocalUser);
			case 'questions':
				// Polls are indexed by the note they are attached to.
				const [pollNote, poll] = await Promise.all([
					Notes.findOneOrFail({ id: parsed.id }),
					Polls.findOneOrFail({ noteId: parsed.id }),
				]);
				return await renderQuestion({ id: pollNote.userId }, pollNote, poll);
			case 'likes':
				const reaction = await NoteReactions.findOneOrFail({ id: parsed.id });
				return renderActivity(renderLike(reaction, { uri: null }));
			case 'follows':
				// if rest is a <followee id>
				if (parsed.rest != null && /^\w+$/.test(parsed.rest)) {
					const [follower, followee] = await Promise.all(
						[parsed.id, parsed.rest].map((id) => Users.findOneOrFail({ id })));
					return renderActivity(renderFollow(follower, followee, url));
				}

				// Another situation is there is only requestId, then obtained object from database.
				const followRequest = await FollowRequests.findOne({
					id: parsed.id,
				});
				if (followRequest == null) {
					throw new Error('resolveLocal: invalid follow URI');
				}
				const follower = await Users.findOne({
					id: followRequest.followerId,
					host: IsNull(),
				});
				const followee = await Users.findOne({
					id: followRequest.followeeId,
					host: Not(IsNull()),
				});
				if (follower == null || followee == null) {
					throw new Error('resolveLocal: invalid follow URI');
				}
				return renderActivity(renderFollow(follower, followee, url));
			default:
				throw new Error(`resolveLocal: type ${parsed.type} unhandled`);
		}
	}
}
