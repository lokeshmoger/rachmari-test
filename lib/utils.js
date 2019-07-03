const { Toolkit } = require('actions-toolkit');

const getTools = () => {
  const tools = new Toolkit();
  if (typeof tools.context.event === 'undefined') {
    throw new Error('GitHub Actions environment unavailable');
  }
  return tools;
};

module.exports.getTools = getTools;
