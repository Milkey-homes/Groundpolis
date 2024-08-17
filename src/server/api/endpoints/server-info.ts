import * as os from 'os';
import * as si from 'systeminformation';
import define from '../define';
import config from '../../../config';

export const meta = {
	requireCredential: false as const,

	desc: {
	},

	tags: ['meta'],

	params: {
	},
};

export default define(meta, async (ps, user) => {
	let metricsActive = false;
	if (!config.hideServerInfo || (user != null && (user.isAdmin || user.isModerator))) {
		metricsActive = true;
	}
	const memStats = await si.mem();
	const fsStats = await si.fsSize();

	return {
		machine: !metricsActive ? 'Unknown' : os.hostname(),
		cpu: {
			model: !metricsActive ? 'Unknown' : os.cpus()[0].model,
			cores: !metricsActive ? 'Unknown' : os.cpus().length
		},
		mem: {
			total: !metricsActive ? 'Unknown' : memStats.total
		},
		fs: {
			total: !metricsActive ? 'Unknown' : fsStats[0].size,
			used: !metricsActive ? 'Unknown' : fsStats[0].used,
		},
	};
});
