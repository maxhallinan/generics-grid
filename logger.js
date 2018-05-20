const winston = require(`winston`);

const _ = module.exports;

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      timestamp: true,
    }),
  ],
});

_.debug = logger.debug;

_.error = logger.error;

_.info = logger.info;

_.log = (...args) => logger.info(...args);

_.verbose = logger.verbose;

_.warn = logger.warn;
