import * as IPCIDR from 'ip-cidr';

export function getIpHash(ip: string) {
	// because a single person may control many IPv6 addresses,
	// only a /64 subnet prefix of any IP will be taken into account.
	// (this means for IPv4 the entire address is used)
	const prefix = IPCIDR.createAddress(ip).mask(64);
	return 'ip-' + BigInt('0b' + prefix).toString(36);
}
