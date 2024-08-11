import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { FollowRequests } from '../../../../../models';
import { makePaginationQuery } from '../../../common/make-pagination-query';

export const meta = {
	desc: {
		'ja-JP': '自分に届いたフォローリクエストの一覧を取得します。',
		'en-US': 'Get all pending received follow requests.'
	},

	tags: ['following', 'account'],

	requireCredential: true as const,

	kind: 'read:following',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		}
	},
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(FollowRequests.createQueryBuilder('request'), ps.sinceId, ps.untilId)
		.andWhere('request.followeeId = :meId', { meId: user.id });

	const requests = await query
		.take(ps.limit)
		.getMany();

	return await Promise.all(requests.map(req => FollowRequests.pack(req)));
});
