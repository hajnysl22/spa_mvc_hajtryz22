const port = require('dotenv').config().parsed.PORT || 3000;

require('http').createServer(require('./app')).listen(port, function() {
    console.log(`Server běží na http://localhost:${port}...`);
});
