import * as Koa from 'koa';
import { fetchMeta } from '../../../misc/fetch-meta';
import { verifyHcaptcha, verifyRecaptcha } from '../../../misc/captcha';
import { Users, RegistrationTickets } from '../../../models';
import { signup } from '../common/signup';
import { limiter } from '../limiter';
import { getIpHash } from '../../../misc/get-ip-hash';

export default async (ctx: Koa.Context) => {
	const body = ctx.request.body;

	try {
		// not more than 1 attempt per second and not more than 5 attempts per hour
		await limiter({ key: 'signup', duration: 60 * 60 * 1000, max: 5, minInterval: 1000 }, getIpHash(ctx.ip));
	} catch (err) {
		ctx.status = 429;
		ctx.body = {
			error: {
				message: 'Too many attempts to sign up. Try again later.',
				code: 'TOO_MANY_AUTHENTICATION_FAILURES',
				id: '22d05606-fbcf-421a-a2db-b32610dcfd1b',
			},
		};
		return;
	}

	const instance = await fetchMeta(true);

	// Verify *Captcha
	// ただしテスト時はこの機構は障害となるため無効にする
	if (process.env.NODE_ENV !== 'test') {
		if (instance.enableHcaptcha && instance.hcaptchaSecretKey) {
			await verifyHcaptcha(instance.hcaptchaSecretKey, body['hcaptcha-response']).catch(e => {
				ctx.throw(400, e);
			});
		}

		if (instance.enableRecaptcha && instance.recaptchaSecretKey) {
			await verifyRecaptcha(instance.recaptchaSecretKey, body['g-recaptcha-response']).catch(e => {
				ctx.throw(400, e);
			});
		}
	}

	const username = body['username'];
	const password = body['password'];
	const host: string | null = process.env.NODE_ENV === 'test' ? (body['host'] || null) : null;
	const invitationCode = body['invitationCode'];

	if (instance && instance.disableRegistration) {
		if (instance.disableInvitation || invitationCode == null || typeof invitationCode != 'string') {
			ctx.status = 400;
			return;
		}

		const ticket = await RegistrationTickets.findOne({
			code: invitationCode
		});

		if (ticket == null) {
			ctx.status = 400;
			return;
		}

		RegistrationTickets.delete(ticket.id);
	}

	try {
		const { account, secret } = await signup(username, password, host);

		const res = await Users.pack(account, account, {
			detail: true,
			includeSecrets: true
		});

		(res as any).token = secret;

		ctx.body = res;
	} catch (e) {
		ctx.throw(400, e);
	}
};
