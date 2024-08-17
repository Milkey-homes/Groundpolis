import autobind from 'autobind-decorator';
import Xev from 'xev';
import Channel from '../channel';
import config from '../../../../config';

const ev = new Xev();

export default class extends Channel {
	public readonly chName = 'serverStats';
	public static shouldShare = true;
	public static requireCredential = true;
	private active = false;

	@autobind
	public async init(params: any) {
		this.active = !config.hideServerInfo || !!(this.user?.isAdmin || this.user?.isModerator);
		if (this.active) ev.addListener('serverStats', this.onStats);
	}

	@autobind
	private onStats(stats: any) {
		this.send('stats', stats);
	}

	@autobind
	public onMessage(type: string, body: any) {
		if (!this.active) return;
		switch (type) {
			case 'requestLog':
				ev.once(`serverStatsLog:${body.id}`, statsLog => {
					this.send('statsLog', statsLog);
				});
				ev.emit('requestServerStatsLog', {
					id: body.id,
					length: body.length
				});
				break;
		}
	}

	@autobind
	public dispose() {
		ev.removeListener('serverStats', this.onStats);
	}
}
