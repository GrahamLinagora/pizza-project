var xmpp = require('simple-xmpp')
	,fs = require('fs')
	,os = require('os')
	,path = require('path')
	,child_process = require('child_process')
	,xmppConf = require('./conf/xmppConf.js')
	,users = require('./conf/userList.js')
	,insults = require('./conf/insults.js')
	,hasDnDException = require('./conf/dndException')
	,pizzaPlaces = require('./conf/pizza-place.js')
	,pizzaPlace
	,notified;

var REQUEST_TIMEOUT = 900000;
var WARNING_TIMEOUT = 300000;

function getSaveDirPath() {
	return path.resolve(os.tmpdir(), 'pizza');
}

function getSaveFilePath(user) {
	return path.resolve(getSaveDirPath(), user);
}

var answerers = new Array();
var connectedUsers = new Array();
var answers = {};

function saveAnswer(user,answer,callback) {
	if (!answers[user]) {
		answers[user] = [];
	}
	answers[user].push(answer);

	fs.appendFile(getSaveFilePath(user), answer+'\n', function (err) {
	  if (err) throw err;
	  console.log('Data saved');
		callback(user, answer);
	});
}

function handleAnswer(user,answer,callback) {
	//memorize that the user has answered
	if(answerers.indexOf(user)===-1) {
		answerers[answerers.length] = user;
	}
	//also add the user in the connected users in case he chatted without having received a command request
	if(connectedUsers.indexOf(user)===-1) {
		connectedUsers[connectedUsers.length] = user;
	}
	//save the answer in a file
	saveAnswer(user,answer,callback);
}

function sendWarning(user) {
	xmpp.probe(user, function(state) {
		console.log('Sending warning : %s state is %s',user,state);
		if(state=='online' || state=='away'|| (state==='dnd' && hasDnDException(user))) {
			xmpp.send(user,'T\'as pas répondu, tu veux quelquechose ou bien ??? (plus que 5 minutes pour répondre...)');
			console.log('Warning sent to %s',user);
		}
	});
}

function sendWarnings() {
	for(i=0;i<connectedUsers.length;i++) {
		var user = connectedUsers[i];
		if(answerers.indexOf(user)==-1) {
			sendWarning(user);
		}
	}
}

function sendCommandRequest(user) {
	console.log('Try for %s',user);
	xmpp.probe(user, function(state) {
		console.log('%s state is %s',user,state);
		if(state=='online' || state=='away' || (state==='dnd' && hasDnDException(user))) {
			connectedUsers[connectedUsers.length] = user;
			xmpp.send(user,'Buongiorno ! Tu veux une pizza de ' + pizzaPlace.name + '?\n' + pizzaPlace.menu);
		}
	});
}

function sendAck(user) {
	xmpp.send(user,'Ok c\'est noté !');
}

function searchInsult(msg) {
	var insult;
	var lowerCaseMessage = msg.toLowerCase();
	for(i=0; i<insults.length; i++) {
		if(lowerCaseMessage.indexOf(insults[i]) !== -1) {
			return insults[i];
		}
	}
	return null;
}

function sendAckAndInsult(user, insult) {
	console.log('Insulte retournée à', user, ' : ', insult);
	xmpp.send(user,'Ok c\'est noté ! ('+insult+' toi même !)');
}

function sendResponse(user, userMsg) {
	var insult = searchInsult(userMsg);
	if(insult) {
		sendAckAndInsult(user, insult);
	}
	else {
		sendAck(user);
	}
}

function sendCommandRequests() {
	//send a msg to all connected users from the user list
	for(i=0; i<users.length; i++) {
		var user = users[i];
		sendCommandRequest(user);
	}
}

function formattedAnswers() {
	var formattedAnswer = "";
	answerers.forEach(function(answerer) {
		formattedAnswer += answerer;
		formattedAnswer += " : ";
		answers[answerer].forEach(function(answer) {
			formattedAnswer += answer;
			formattedAnswer += " ";
		});
		formattedAnswer += "\n";
	});
	return formattedAnswer;
}

function notify() {
	if (notified && connectedUsers.indexOf(notified) >= 0) {
		console.log('Notification to : %s', notified);
		xmpp.send(notified, formattedAnswers());
	}
}

function endProgram() {
	notify();
	child_process.spawn('notify-send', ['\n\nIt\'s pizza time !\n\n']);
	xmpp.disconnect();
	console.log('Process ending at : '+new Date());
}

xmpp.on('online', function() {
	console.log('Yes, I\'m connected!');
	sendCommandRequests();	
});

xmpp.on('chat', function(from, message) {
	console.log('Message reçu --> %s says %s',from,message);
	handleAnswer(from,message,sendResponse);
});

xmpp.on('error', function(err) {
  console.error(err);
});

//PROGRAM START
if(!fs.existsSync(getSaveDirPath())) {
	fs.mkdirSync(getSaveDirPath());
}

console.log('Process starting at :', new Date());

var pizzaPlaceArg = process.argv[2];
notified = process.argv[3];
if (!pizzaPlaceArg) {
	console.log('Choisis une pizza place putain !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
} else {
	pizzaPlace = pizzaPlaces[pizzaPlaceArg];
	if (!pizzaPlace) {
		console.log('Elle existe pas ta merde !!!!! ', pizzaPlaceArg, '\nCelles qui existent : ', Object.keys(pizzaPlaces));
	} else {
		xmpp.connect({
			jid: xmppConf.myJid,
			password: xmppConf.myPwd,
			port: 5222
		});

		//after 15 minutes
		setTimeout(function() {
			//if all connected users already have answered, end the program
			if(answerers.length == connectedUsers.length) {
				console.log('Everybody has answered, no warning sent');
				console.log('connectedUsers : '+connectedUsers);
				console.log('answerers : '+answerers);
				endProgram();
			}
			else {
				sendWarnings();
				//wait five more minutes for possible new answers and end the program
				setTimeout(function() {
					endProgram();
				}, WARNING_TIMEOUT);
			}
		}, REQUEST_TIMEOUT);
	}
}
