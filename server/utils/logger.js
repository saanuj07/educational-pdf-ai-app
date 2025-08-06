const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
    // File logging disabled for now to avoid path issues
    // new winston.transports.File({ filename: '../logs/app.log' })
  ]
});
logger.stream = {
  write: (message) => logger.info(message.trim())
};
module.exports = logger;
