import redis from '../db/redis';
import { User } from '../models/entities/user';
import { Note } from '../models/entities/note';
import config from '../config';

class Publisher {
	private publish = (channel: string, type: string | null, value?: any): void => {
		const message = type == null ? value : value == null ?
			{ type: type, body: null } :
			{ type: type, body: value };

		redis.publish(config.host, JSON.stringify({
			channel: channel,
			message: message
		}));
	}

	public publishInternalEvent = (type: string, value?: any): void => {
		this.publish('internal', type, typeof value === 'undefined' ? null : value);
	};

	public publishUserEvent = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`user:${userId}`, type, typeof value === 'undefined' ? null : value);
	};

	public publishBroadcastStream = (type: string, value?: any): void => {
		this.publish('broadcast', type, typeof value === 'undefined' ? null : value);
	}

	public publishMainStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`mainStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishDriveStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`driveStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishNoteStream = (noteId: Note['id'], type: string, value: any): void => {
		this.publish(`noteStream:${noteId}`, type, {
			id: noteId,
			body: value
		});
	}

	public publishNotesStream = (note: any): void => {
		this.publish('notesStream', null, note);
	}

	public publishAdminStream = (userId: User['id'], type: string, value?: any): void => {
		this.publish(`adminStream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}
}

const publisher = new Publisher();

export default publisher;

export const publishInternalEvent = publisher.publishInternalEvent;
export const publishUserEvent = publisher.publishUserEvent;
export const publishBroadcastStream = publisher.publishBroadcastStream;
export const publishMainStream = publisher.publishMainStream;
export const publishDriveStream = publisher.publishDriveStream;
export const publishNoteStream = publisher.publishNoteStream;
export const publishNotesStream = publisher.publishNotesStream;
export const publishAdminStream = publisher.publishAdminStream;
