import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Users, Signins } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
  desc: {
		'ja-JP': '指定したユーザーの情報を取得します。',
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

  params: {
    userId: {
      validator: $.type(ID),
      desc: {
        'ja-JP': '対象のユーザーID',
        'en-US': 'The user ID which you want to suspend'
      }
    },

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
  }
};

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
  const user = await Users.findOne(ps.userId as string);

  if (user == null) {
    throw new Error('user not found');
  }

  if ((me.isModerator && !me.isAdmin) && user.isAdmin) {
		throw new Error('cannot show info of admin');
	}

	const query = makePaginationQuery(Signins.createQueryBuilder('signin'), ps.sinceId, ps.untilId)
		.andWhere(`signin.userId = :meId`, { meId: user.id });

	const history = await query.take(ps.limit).getMany();

	return await Promise.all(history.map(record => Signins.pack(record)));
});
