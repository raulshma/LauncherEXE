const fs = require('fs');

const logFilePath = `${__dirname}\\logs\\log.txt`;

const log = (type = 'INFO', data, info) => {
  const newLog = `${type} ||\t\t ${data} ${
    info ? '--' + info : ''
  } \t\t ${new Date().toISOString()}\n`;
  fs.appendFile(logFilePath, newLog, (err) => {
    if (!err) return true;
    else {
      console.log(err);
      return false;
    }
  });
};

module.exports = log;
