import * as cluster from 'cluster';
import { initDb } from '../db/postgre';
import { program } from '../argv';

/**
 * Init worker process
 */
export async function workerMain() {
	await initDb();

	// start server
	if (!program.onlyQueue) {
		await require('../server').default();
	}

	// start job queue
	if (!program.onlyServer) {
		require('../queue').default();
	}

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
