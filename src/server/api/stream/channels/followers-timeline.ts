import autobind from 'autobind-decorator';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';
import { Notes, Users } from '../../../../models';
import { PackedNote } from '../../../../models/repositories/note';

export default class extends Channel {
	public readonly chName = 'followersTimeline';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: any) {
		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	@autobind
	private async onNote(note: PackedNote) {
		const user = await Users.pack(note.userId, this.user!, { detail: true });
		if (this.user!.id !== note.userId && !user.isFollowed ) return;

		if (['followers', 'specified'].includes(note.visibility)) {
			note = await Notes.pack(note.id, this.user!, {
				detail: true
			});

			if (note.isHidden) {
				return;
			}
		} else {
			// リプライなら再pack
			if (note.replyId != null) {
				note.reply = await Notes.pack(note.replyId, this.user!, {
					detail: true
				});
			}
			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await Notes.pack(note.renoteId, this.user!, {
					detail: true
				});
			}
		}

		// 関係ない返信は除外
		if (note.reply) {
			// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
			if (note.reply.userId !== this.user!.id && note.userId !== this.user!.id && note.reply.userId !== note.userId) return;
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, this.muting)) return;

		this.send('note', note);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}