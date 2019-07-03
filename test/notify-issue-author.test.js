const { cloneDeep } = require('lodash');

// Suppress logging
jest.mock('bunyan');

const notifyIssueAuthor = require('../lib/notify-issue-author');
const issueOpenedPayload = require('./fixtures/issues.opened');
const issueClosedPayload = require('./fixtures/issues.closed');

describe('notifyIssueAuthor', () => {
  let tools;

  beforeEach(() => {
    tools = {
      github: { issues: { listComments: jest.fn(), createComment: jest.fn() } },
      arguments: { _: [] },
      context: { event: 'issues', actor: 'octocat' }
    };
  });

  it('ignores irrelevant events', async () => {
    Object.assign(tools.context, { payload: issueOpenedPayload });
    await notifyIssueAuthor(tools);

    // Confirm we didn't do anything
    expect(tools.github.issues.listComments).toHaveBeenCalledTimes(0);
    expect(tools.github.issues.createComment).toHaveBeenCalledTimes(0);
  });

  it('ignores issues closed by issue author', async () => {
    // Clone payload, overwrite author
    const payload = Object.assign(cloneDeep(issueClosedPayload), { issue: { user: { login: 'octocat' } } });

    Object.assign(tools.context, { payload });
    await notifyIssueAuthor(tools);

    // Confirm we didn't do anything
    expect(tools.github.issues.listComments).toHaveBeenCalledTimes(0);
    expect(tools.github.issues.createComment).toHaveBeenCalledTimes(0);
  });

  it('ignores issues closed when author already mentioned', async () => {
    // Mock out tools.github.issues.listComments
    tools.github.issues.listComments.mockResolvedValueOnce({ data: [{ body: 'Closing this out :v: /cc @swinton.' }] });

    Object.assign(tools.context, { payload: issueClosedPayload });
    await notifyIssueAuthor(tools);

    // Confirm we didn't create a comment
    expect(tools.github.issues.listComments).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.listComments).toHaveBeenNthCalledWith(1, {
      number: 36,
      owner: 'swinton',
      repo: 'example',
      since: '0000-00-00T00:00:00Z'
    });
    expect(tools.github.issues.createComment).toHaveBeenCalledTimes(0);
  });

  it('distinguishes between similar @-mentions', async () => {
    // Mock out tools.github.issues.listComments
    tools.github.issues.listComments.mockResolvedValueOnce({
      data: [{ body: 'Closing this out :v: /cc @swinton88.' }]
    });

    Object.assign(tools.context, { payload: issueClosedPayload });
    await notifyIssueAuthor(tools);

    expect(tools.github.issues.listComments).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.listComments).toHaveBeenNthCalledWith(1, {
      number: 36,
      owner: 'swinton',
      repo: 'example',
      since: '0000-00-00T00:00:00Z'
    });
    expect(tools.github.issues.createComment).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.createComment).toHaveBeenNthCalledWith(1, {
      body: '@swinton, this issue was closed by @octocat.',
      number: 36,
      owner: 'swinton',
      repo: 'example'
    });
  });

  it('notifies the issue author when author not yet mentioned', async () => {
    // Mock out tools.github.issues.listComments
    tools.github.issues.listComments.mockResolvedValueOnce({ data: [{ body: 'Closing this out :v:.' }] });

    Object.assign(tools.context, { payload: issueClosedPayload });
    await notifyIssueAuthor(tools);

    expect(tools.github.issues.listComments).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.listComments).toHaveBeenNthCalledWith(1, {
      number: 36,
      owner: 'swinton',
      repo: 'example',
      since: '0000-00-00T00:00:00Z'
    });
    expect(tools.github.issues.createComment).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.createComment).toHaveBeenNthCalledWith(1, {
      body: '@swinton, this issue was closed by @octocat.',
      number: 36,
      owner: 'swinton',
      repo: 'example'
    });
  });

  it('notifies the issue author when no comments are found', async () => {
    // Mock out tools.github.issues.listComments
    tools.github.issues.listComments.mockResolvedValueOnce({ data: [] });

    Object.assign(tools.context, { payload: issueClosedPayload });
    await notifyIssueAuthor(tools);

    expect(tools.github.issues.listComments).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.listComments).toHaveBeenNthCalledWith(1, {
      number: 36,
      owner: 'swinton',
      repo: 'example',
      since: '0000-00-00T00:00:00Z'
    });
    expect(tools.github.issues.createComment).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.createComment).toHaveBeenNthCalledWith(1, {
      body: '@swinton, this issue was closed by @octocat.',
      number: 36,
      owner: 'swinton',
      repo: 'example'
    });
  });

  it('allows the comment body to be overridden', async () => {
    // Mock out tools.github.issues.listComments
    tools.github.issues.listComments.mockResolvedValueOnce({ data: [] });

    Object.assign(tools.context, { payload: issueClosedPayload });
    Object.assign(tools.arguments, {
      _: [],
      template: ':loudspeaker: @{{ author }}, your issue was closed, by @{{ actor }}.'
    });
    await notifyIssueAuthor(tools);

    expect(tools.github.issues.listComments).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.listComments).toHaveBeenNthCalledWith(1, {
      number: 36,
      owner: 'swinton',
      repo: 'example',
      since: '0000-00-00T00:00:00Z'
    });
    expect(tools.github.issues.createComment).toHaveBeenCalledTimes(1);
    expect(tools.github.issues.createComment).toHaveBeenNthCalledWith(1, {
      body: ':loudspeaker: @swinton, your issue was closed, by @octocat.',
      number: 36,
      owner: 'swinton',
      repo: 'example'
    });
  });
});
