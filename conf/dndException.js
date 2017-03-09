var exceptionUsers = [
	'trousselin@linagora.com',
	'thomas.morsellino@gmail.com'
];

/**var exceptionUsers = [
	'gcrosmarie@linagora.com',
];*/

var userList = require('./userList');

module.exports = function(user) {
	return userList.indexOf(user) !== -1 && exceptionUsers.indexOf(user) !== -1;
};
