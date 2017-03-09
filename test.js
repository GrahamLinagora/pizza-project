var xmpp = require('simple-xmpp')
	,fs = require('fs')
	,os = require('os')
	//,conf = require('./conf/conf.js')
	,child_process = require('child_process')
	,path = require('path');

xmpp.on('close', function() {
  console.log('Connection has been closed!');
//	console.log('---DEBUG--- process._getActiveRequests() : '+process._getActiveRequests());
//	console.log('---DEBUG--- process._getActiveHandles() : '+process._getActiveHandles());
});

function sendCommandRequest() {
	var user = 'gcrosmarie@linagora.com';
	console.log('Try for %s',user);
	xmpp.probe(user, function(state) {
		console.log('%s state is %s',user,state);
		if(state=='online' || state=='away') {
			xmpp.send(user,'TEST TEST TEST');
		}
	});
}

xmpp.on('online', function() {
	console.log('Yes, I\'m connected!');
//	sendCommandRequest();
});

/**xmpp.connect({
	jid		: conf.myJid,
	password	: conf.myPwd,
	port		: 5222
});

setTimeout(function() {
	xmpp.disconnect();
},2000);
*/

var array = [1,2,3];

var times = array.map(function(e) {
	e*2;
});

console.log(times);
