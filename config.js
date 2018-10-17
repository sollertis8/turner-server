exports.DATABASE_URL = process.env.DATABASE_URL || global.DATABASE_URL || 'mongodb://readonly:turner@ds043348.mongolab.com:43348/dev-challenge';
exports.PORT = process.env.PORT || 8080;