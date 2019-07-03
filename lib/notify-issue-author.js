const nunjucks = require('nunjucks');
const logger = require('./logger');

// Return true if event represents a closed issue event
const issueClosedEvent = ({ event, payload }) => {
  return event === 'issues' && payload.action === 'closed';
};

// Return true if author of issue was mentioned since the issue was closed
const authorMentionedSinceIssueClosed = async (github, { owner, repo, number, since, author }) => {
  // Get issue comments since the issue was closed
  const { data: comments } = await github.issues.listComments({
    owner,
    repo,
    number,
    since
  });

  const re = new RegExp(`@${author}\\b`, 'g');
  // Return true if the first comment mentions the author
  return comments.length > 0 && re.test(comments[0].body);
};

// Notify author of an issue when their issue gets closed
const notifyIssueAuthor = async ({ github, arguments: argv, context }) => {
  const { event, actor, payload } = context;
  // Get repo owner and repo name
  const {
    owner: { login: owner },
    name: repo
  } = payload.repository;

  // Get issue author, number, and closed_at date
  const {
    user: { login: author },
    number: issueNumber,
    closed_at: issueClosedAt
  } = payload.issue;

  // Don't comment unless the event is a closed issue event
  if (!issueClosedEvent(context)) {
    logger.info(`Ignoring ${event}#${payload.action} event`);
    return;
  }

  // Don't comment when the author closed the issue
  if (actor === author) {
    logger.info('Ignoring, issue closed by author');
    return;
  }

  // Don't comment when the author was already mentioned
  if (
    await authorMentionedSinceIssueClosed(github, { owner, repo, number: issueNumber, since: issueClosedAt, author })
  ) {
    logger.info('Ignoring, author previously mentioned');
    return;
  }

  // Use `--template` argument to pass a custom message
  const { template = '@{{ author }}, this issue was closed by @{{ actor }}.' } = argv;
  // Comment on the issue to let the author know the issue is now closed
  const body = nunjucks.renderString(template, {
    author,
    actor
  });
  await github.issues.createComment({ owner, repo, number: issueNumber, body });
  logger.info('Author was notified');
};

module.exports = notifyIssueAuthor;
