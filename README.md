Pizzagora
---------------

**Installation**
>npm install

**Use**
>node app.js

**Process**

 * Connects to Jabber network as pizzagoragso@gmail.com (cf config.js)
 * Sends command request to all users from userList.js (these users must be xmpp buddies of pizzagoragso@gmail.com) who are 'online' or 'away'
 * Write user answsers in /tmp/pizza/$user$ and acks back
 * After 15 minutes, sends warning to users which have not answered yet if there is some, else terminates
 * After 5 more minutes if some warnings are sent, goes offline from jabber and sends a desktop notification


**Known bugs**

  - connection is not closed -> program never exits
