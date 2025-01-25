import * as http from 'http';
import * as https from 'https';
import net from 'net';
import config from '../config';
import * as IPCIDR from 'ip-cidr';
const PrivateIp = require('private-ip');

declare module 'http' {
	interface Agent {
		createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket;
	}
}

function isPrivateIp(ip: string): boolean {
	for (const net of config.allowedPrivateNetworks || []) {
		const cidr = new IPCIDR(net);
		if (cidr.contains(ip)) {
			return false;
		}
	}

	return PrivateIp(ip);
}

function checkConnection(socket: net.Socket) {
	const address = socket.remoteAddress;
	if (process.env.NODE_ENV === 'production') {
		if (address && IPCIDR.isValidAddress(address) && isPrivateIp(address)) {
			socket.destroy(new Error(`Blocked address: ${address}`));
		}
	}
}

export class CheckedHttpAgent extends http.Agent {
	createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket {
		const socket = super.createConnection(options, callback).on('connect', () => { checkConnection(socket) });
		return socket;
	}
}

export class CheckedHttpsAgent extends https.Agent {
	createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket {
		const socket = super.createConnection(options, callback).on('connect', () => { checkConnection(socket) });
		return socket;
	}
}
