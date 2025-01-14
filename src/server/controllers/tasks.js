import httpStatus from 'http-status';

import { respondWithSuccess, respondWithError } from '~/server/helpers/respond';
import { voteInvitationEmail, voteEmail } from '~/server/tasks/sendmail';
import Invitation from '~/server/models/invitation';
import { setInRedis } from '~/server/services/redis';
import { generateRandomString } from '~/server/services/crypto';

// tasks which can only be submitted by a logged-in admin user
const tasksProtected = ['vote_invitations'];

async function create(req, res) {
  const { kind, data } = req.body;

  if ((!req.locals || !req.locals.user) && tasksProtected.includes(kind)) {
    return respondWithError(
      res,
      { message: 'Unauthorized' },
      httpStatus.UNAUTHORIZED,
    );
  }

  switch (kind) {
    case 'vote_invitations': {
      await Promise.all(
        data.map(async ({ to, ...rest }) => {
          await Invitation.create({ email: to, ...rest });
          return voteInvitationEmail(to, rest);
        }),
      );
      break;
    }
    case 'vote': {
      const invitation = await Invitation.findOne({
        where: {
          email: data.email,
          festivalSlug: data.festivalSlug,
        },
      });
      if (!invitation) {
        return respondWithError(
          res,
          { message: 'No vote invitation found' },
          httpStatus.NOT_FOUND,
        );
      }
      const random = generateRandomString(32);
      await setInRedis(
        random,
        `${data.email}:${data.festivalSlug}`,
        'EX',
        60 * 30, // expiring in 30 minutes
      );
      return respondWithSuccess(
        res,
        { token: random },
        httpStatus.CREATED,
      );
    }
  }

  respondWithSuccess(res, undefined, httpStatus.CREATED);
}

export default {
  create,
};
