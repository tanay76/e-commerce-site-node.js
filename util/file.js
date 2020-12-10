const fs = require('fs');

exports.deleteFile = (filePath) => {
  fs.unlink(filePath, err => {
    if (err) {
      // console.log('Error in file.js');
      throw new Error(err);
    }
  });
};