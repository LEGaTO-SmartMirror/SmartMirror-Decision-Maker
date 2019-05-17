'use strict';
const NodeHelper = require('node_helper');
var mysql = require('mysql');



module.exports = NodeHelper.create({

	setup: function () {
		this.con = mysql.createConnection({
  			host: "localhost",
  			user: "smartmirror",
  			password: "Sm4rt-M1rr0r"
		});
		this.con.connect(function(err) {
 			if (err) throw err;
  			console.log("Connected to mysql!");
			
	//		con.query("select * from mydb.user;" , function (err, result, fields) {
	//		//con.query("select * from mydb.user;", function (err, result, fields) {
   // 			if (err) throw err;
    //			console.log(result[1].name);
 	//		});
		});	
	},



	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		const self = this;
		if(notification === 'CONFIG') {
			this.config = payload
      		this.setup(); 
    	}else if(notification === 'LOGGIN_USER') {
			this.con.query("select * from mydb.user, mydb.login_view where ID = " + payload + " AND ID = user_ID", function (err, result, fields) {
				if (err) throw err;
				self.sendSocketNotification('LOGGIN_USER_INFOS',JSON.stringify(result));
			});
    	}else if(notification === 'GREET_USER') {
			this.con.query("select " + payload[0] + " from mydb.greetings", function (err, result, fields) {
				var min=0; 
    			var max=result.length -1;  
    			var random =Math.floor(Math.random() * (+max - +min)) + +min;

				
				var greeting =(result[random][payload[0]]).replace("USER",payload[1]);
				//console.log("Greet with: " + greeting);
				self.sendSocketNotification('GREET_USER_RESULT',[payload[0],greeting]);

			});
		}
  	}

});
