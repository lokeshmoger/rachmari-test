const Logger = require('bunyan');
const bunyanFormat = require('bunyan-format');

const logger = new Logger({
  name: 'notify-issue-author',
  level: process.env.LOG_LEVEL || 'info',
  stream: bunyanFormat({ outputMode: process.env.LOG_FORMAT || 'short' }, process.stderr)
});

module.exports = logger;
