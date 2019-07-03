const logger = require('../lib/logger');

describe('logger', () => {
  it('exposes a fatal method', () => {
    expect(logger.fatal).not.toBeUndefined();
  });
  it('exposes an error method', () => {
    expect(logger.error).not.toBeUndefined();
  });
  it('exposes a warn method', () => {
    expect(logger.warn).not.toBeUndefined();
  });
  it('exposes an info method', () => {
    expect(logger.info).not.toBeUndefined();
  });
  it('exposes a debug method', () => {
    expect(logger.debug).not.toBeUndefined();
  });
  it('exposes a trace method', () => {
    expect(logger.trace).not.toBeUndefined();
  });
});
