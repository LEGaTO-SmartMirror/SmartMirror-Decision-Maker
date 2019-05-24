/**
 * @file smartmirror-decision-maker.js
 *
 * @author nkucza
 * @license MIT
 *
 * @see  https://github.com/NKucza/smartmirror-decision-maker
 */


Module.register("SmartMirror-Decision-Maker", {

	mainManuStateObj: {
		none: 0,
		main: 1,
		camera:2,
		augmentations:3,
		messevideo:4,
		application:5,
		smarthome:6,
		coffee:7,
		preferences:8,
		user_settings:9
	},

	mainManuState: 0,

	currentuserid: -1,

	facerecognitionshown: false,
	objectdetectionshown: false,
	gesturerecognitionshown: false,
	aiartmirrorshown: false,

	speechrec_aktiv: false,

	flat_right_id : -1,

	timeOfLastFlatRight : 0,
	timeOfLastFlatLeft : 0,
	timeOfLastOkay : 0,
	lastHightOfFlatRight : 0,
	lastHightOfFlatLeft : 0,

	timeOFLastGreet: 0,
	timebetweenGreets: 50000,

	timeOfLastCoffee: 0,

	defaults: {
		module_list: [
			{name : "clock", words : ["clock","uhr"]},
			{name : "calendar", words : ["calendar"]},
			{name : "smartmirror-speechrecognition", words : ["speech"]},
			{name : "MMM-cryptocurrency", words : ["crypto"]},
			{name : "weatherforecast", words : ["weather","wetter"]},
			{name : "currentweather", words : ["weather","wetter"]},
			{name : "newsfeed", words : ["news feed" , "newsfeed"]},
			{name : "MMM-SimpleLogo", words : ["legato-logo"]},
			{name : "MMM-PublicTransportHafas", words : ["transportation"]},
			{name : "smartmirror-mensa-plan", words : ["mensa"]},
			{name : "smartmirror-main-menu", words : ["menu"]},
			{name : "smartmirror-center-display", words : ["centerdisplay"]},
			{name : "smartmirror-bivital", words: ["bivital"]},
			{name : "MMM-SoccerLiveScore", words: ["soccer"]},
			{name : "smartmirror-coffeebot", words : ["coffee","coffeebot"]}
		],
		speechrec_hotword: ["jarvis","smartmirror"]
	},

	start: function() {
		this.currentuserid = -1;
		console.log(this.name + " has started...");
		this.mainManuState = this.mainManuStateObj.none;
		console.log("[" + this.name + "] " + "sending MAIN_MENU: none");
		this.sendNotification('MAIN_MENU', 'none');
		this.sendSocketNotification('CONFIG', this.config);	
		//config.language = "de";
		//Translator.loadCoreTranslations(config.language);

	},

	notificationReceived: function(notification, payload, sender) {
		if (notification === 'DOM_OBJECTS_CREATED') {
			var self = this;
      		MM.getModules().enumerate(function(module) {
				module.hide(0, function() {
					Log.log('Module is hidden.');
				}, {lockString: "lockString"});
			});
		}else if(notification === 'TRANSCRIPT_EN') {
			console.log("[" + this.name + "] " + "transcript received: " + payload);
			this.process_string(payload)
		}else if(notification === 'TRANSCRIPT_DE') {
			console.log("[" + this.name + "] " + "transcript received: " + payload);
			this.process_string(payload)
		}else if(notification === 'MENU_CLICKED') {
			console.log("[" + this.name + "] " + "Menu item was clicked: " + payload);
			this.process_string(payload)
		}else if(notification === 'RECOGNIZED_USER') {
			console.log("[" + this.name + "] " + "Face recognition has send following data: " + payload);	
			this.process_rec_persons(payload);
		//}else if(notification === 'FACE_REC_IDS') {
		//	console.log("[" + this.name + "] " + "Face recognition has send following data: " + payload);	
		//	this.process_face_IDs(payload);
		}else if(notification === 'FACE_REC_DETECTIONS') {
			console.log("[" + this.name + "] " + "Face recognition has send following data: " + payload);	
			this.process_face_IDs(payload.recognised_identities);
		}else if (notification === 'ALL_MODULES_STARTED') {
			this.sendSocketNotification('LOGGIN_USER', -1);
			this.sendNotification('smartmirror-TTS-en',"Welcome to the smart mirror!");
		}else if(notification === 'GESTURE_DETECTED') {
			//var parsed_message = JSON.parse(payload)
			this.process_gesture(payload);
		}else if (notification === 'DETECTED_GESTURES') {
			this.process_gestures_object(payload);
		}else if (notification === 'HOTWORD_TRIGGERED') {
			var wordIncluded = false;
			this.config.speechrec_hotword.forEach(function(element) {
				if (payload.includes(element)){
					wordIncluded = true;
				}
			});
			if (wordIncluded){
				this.sendNotification('SPEECHREC_AKTIV',true);
				this.speechrec_aktiv = true;
				setTimeout(() => {this.disable_speechrec();}, 10000);				
			}
		}
	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if(notification === 'LOGGIN_USER_INFOS') {
			//console.log("[" + this.name + "] " + "User data received: " + JSON.stringify(JSON.parse(payload)[0]["language"]));	
			//console.log("test " + JSON.parse(payload)[0])
			this.adjustViewLogin((JSON.parse(payload))[0]);
			if (JSON.parse(payload)[0]["ID"] > 0) {
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 5.0);
				//this.sendNotification('smartmirror-TTS-en',"Hello, nice to see you");
				var d = new Date();
				if(d.getTime() - this.timeOFLastGreet > this.timebetweenGreets ){
					this.sendSocketNotification("GREET_USER",[JSON.parse(payload)[0]["language"],JSON.parse(payload)[0]["name"]])
					this.timeOFLastGreet = d.getTime();   
				}   			
			}else if (JSON.parse(payload)[0]["ID"] == -1) {
				//if nodody is in front of the mirror close everything
				//menu closed..
				this.sendNotification('MAIN_MENU', 'none');
				this.mainManuState = this.mainManuStateObj.none;
				//center display closed..
				this.sendNotification('CENTER_DISPLAY', 'HIDEALL');
				this.facerecognitionshown = false;
				this.objectdetectionshown = false;
				this.gesturerecognitionshown = false;
				this.aiartmirrorshown = false;
				///this.sendNotification('CENTER_DISPLAY', 'TOGGLE');

				this.sendNotification("smartmirror-object-detection" + "SetFPS", 2.0);
				this.sendNotification("smartmirror-facerecognition" + "SetFPS", 5.0);
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 1.0);
				this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 1.0);
				setTimeout(() => {this.start_idle_ai_mirror_art();}, 30000);	
				
			}
		}else if(notification === 'GREET_USER_RESULT'){
			if (payload[0] == "de")
				this.sendNotification('smartmirror-TTS-ger',payload[1]);
			else if (payload[0] == "en")
				this.sendNotification('smartmirror-TTS-en',payload[1]);

			this.sendNotification("SHOW_ALERT", {type: "notification", message: payload[1]});


		}
	},

	adjustViewLogin: function(user_config){
		var self = this;
		if(this.aiartmirrorshown == true){
			this.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
			this.aiartmirrorshown = false;
			this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 1.0);

		}
		/*if(config.language != user_config.language){
			config.language = user_config.language;
			Translator.coreTranslations = {},
			Translator.coreTranslationsFallback = {},
			Translator.translations = {},
			Translator.translationsFallback = {},
			Translator.loadCoreTranslations(config.language);
			
				
			this.config.module_list.forEach(function(element) {
				for(var key in user_config){
					if(element.words.includes(key)){
						MM.getModules().withClass(element.name).enumerate(function(module) {
						//	console.log("[" + self.name + "] update dom from: " + element.name);
							module.loadTranslations(function() {});
							module.updateDom(module,1);	
						});
					}
				}
			});
		} */

		this.config.module_list.forEach(function(element) {
			for(var key in user_config){
				if(element.words.includes(key)){
					MM.getModules().withClass(element.name).enumerate(function(module) {
					if(user_config[key]) {
						if (module.hidden)
							module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
					}else{
						 if(!module.hidden)
							module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"})
					}					
					});
				}
			}
		});
	},

	process_face_IDs: function(face_ids){	
		if(this.currentuserid == -1 || face_ids[0] == -1 || !(face_ids.includes(this.currentuserid))){
			if(face_ids.length == 1){
				login_id = face_ids[0];
			} else {
				function findfirstone(element) {
  					return element > 0 ;
				}
				login_id = face_ids.find(findfirstone)
	
				if (typeof login_id === "undefined"){
					login_id = face_ids[0];
				}
			}
			this.sendSocketNotification('LOGGIN_USER', login_id);
			this.currentuserid = login_id;
			console.log("[" + this.name + "] changing current user to: " + login_id );
		} else { // user is not changed!
			console.log("[" + this.name + "] not changing current user" );
		}
	},

	process_rec_persons: function(rec_persons){
		function findfirstone(element) {
  			return element == 1;
		}
		
		rec_persons.findIndex(findfirstone)
		console.log("ID "  + rec_persons.findIndex(findfirstone) + " will be logged in");
		this.sendSocketNotification('LOGGIN_USER', rec_persons.findIndex(findfirstone));	
		
	},
	
	process_string: function(transcript){
		if (typeof transcript === 'string'){

			if(transcript.includes('shutdown') || transcript.includes('sudo') || transcript.includes('reboot')){
				this.sendNotification('smartmirror-TTS-en', "Thorsten no! Stop it!");
				this.sendNotification('smartmirror-TTS-ger', "Genau Thorsten! Lass es sein!");
			}else if(transcript.includes('fuck')){
				this.sendNotification('smartmirror-TTS-en', "language please!");

			}else if(transcript.includes('close')){
				this.sendNotification('MAIN_MENU', 'none');
				this.mainManuState = this.mainManuStateObj.none;

			}else if(this.mainManuState === this.mainManuStateObj.none){			
				if(transcript.includes('menu')){
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}

			}else if(this.mainManuState === this.mainManuStateObj.main){
				if(transcript.includes('camera')||transcript.includes('kamera')||transcript.includes('demonstration')||transcript.includes('detections')){				
					this.sendNotification('MAIN_MENU', 'camera');
					this.mainManuState = this.mainManuStateObj.camera;
				}else if(transcript.includes('image')||transcript.includes('augmentations')){				
					this.sendNotification('MAIN_MENU', 'augmentations');
					this.mainManuState = this.mainManuStateObj.augmentations;
				}else if(transcript.includes('messe')||transcript.includes('video')||transcript.includes('messevideo')){				
					this.sendNotification('MAIN_MENU', 'messevideo');
					this.mainManuState = this.mainManuStateObj.messevideo;
				}else if(transcript.includes('application')||transcript.includes('anwendung')){				
					this.sendNotification('MAIN_MENU', 'application');
					this.mainManuState = this.mainManuStateObj.application;
				}else if(transcript.includes('smarthome')){				
					this.sendNotification('MAIN_MENU', 'smarthome');
					this.mainManuState = this.mainManuStateObj.smarthome;
				}else if(transcript.includes('preference')||transcript.includes('einstellung')){				
					this.sendNotification('MAIN_MENU', 'preferences');
					this.mainManuState = this.mainManuStateObj.preferences;
				}else if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'none');
					this.mainManuState = this.mainManuStateObj.none;
				}

			}else if(this.mainManuState === this.mainManuStateObj.camera){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}else if(transcript.includes('image')||transcript.includes('bild')){				
					this.sendNotification('CENTER_DISPLAY', 'TOGGLE');
				}else if(transcript.includes('distance')||transcript.includes('distanz')){				
					this.sendNotification('CENTER_DISPLAY', 'DISTANCE');
				}else if(transcript.includes('object')){				
					this.sendNotification('CENTER_DISPLAY', 'OBJECT');
					this.objectdetectionshown = !(this.objectdetectionshown);
					if (this.objectdetectionshown) {
						this.sendNotification("smartmirror-object-detection" + "SetFPS", 25.0);
					} else {
						this.sendNotification("smartmirror-object-detection" + "SetFPS", 2.0)
					} 
				}else if(transcript.includes('gesture')||transcript.includes('hand')){				
					this.sendNotification('CENTER_DISPLAY', 'GESTURE');
					this.gesturerecognitionshown = !(this.gesturerecognitionshown);
					if (this.gesturerecognitionshown) {
						this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 25.0);
					} else {
						this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 5.0);
					} 
				}else if(transcript.includes('face')||transcript.includes('gesicht')){				
					this.sendNotification('CENTER_DISPLAY', 'FACE');
					this.facerecognitionshown = !(this.facerecognitionshown);
					if (this.facerecognitionshown) {
						this.sendNotification("smartmirror-facerecognition" + "SetFPS", 25.0);
					} else {
						this.sendNotification("smartmirror-facerecognition" + "SetFPS", 5.0);
					} 
				}else if(transcript.includes('hide all')||transcript.includes('hideALL')||transcript.includes('versteck alles')||transcript.includes('remove all')){
					this.sendNotification('CENTER_DISPLAY', 'HIDEALL');
					this.facerecognitionshown = false;
					this.objectdetectionshown = false;
					this.gesturerecognitionshown = false;
					this.sendNotification("smartmirror-object-detection" + "SetFPS", 2.0);
					this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 1.0);
					this.sendNotification("smartmirror-facerecognition" + "SetFPS", 5.0);
					this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 5.0);
				}else if(transcript.includes('show all')||transcript.includes('showALL')){
					this.sendNotification('CENTER_DISPLAY', 'SHOWALL');
					this.facerecognitionshown = true;
					this.objectdetectionshown = true;
					this.gesturerecognitionshown = true;
					this.sendNotification("smartmirror-object-detection" + "SetFPS", 25.0);
					this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 1.0);
					this.sendNotification("smartmirror-facerecognition" + "SetFPS", 25.0);
					this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 25.0);

				}
			}else if(this.mainManuState === this.mainManuStateObj.augmentations){
				if(transcript.includes('back')||transcript.includes('zurück')){		
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}else if(transcript.includes('aiartmiror')||transcript.includes('ai')||transcript.includes('mirror')||transcript.includes('art')) {
					this.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
					this.aiartmirrorshown = ! this.aiartmirrorshown;
					if (this.aiartmirrorshown) {
						this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 25.0);
					} else {
						this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 1.0);
					}
				}else if(transcript.includes('randomsytle')) {
					this.sendNotification('smartmirror-ai-art-mirror','RANDOM_STYLE');
				}else if(transcript.includes('nextsytle')) {
					this.sendNotification('smartmirror-ai-art-mirror','NEXT_STYLE');
				}else if(transcript.includes('prevsytle')) {
					this.sendNotification('smartmirror-ai-art-mirror','PREV_STYLE');
				}else if(transcript.includes('sourcesytle')) {
					this.sendNotification('smartmirror-ai-art-mirror','DISP_SOURCE');

				}
			}else if(this.mainManuState === this.mainManuStateObj.messevideo){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}
			}else if(this.mainManuState === this.mainManuStateObj.application){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				} else {
					this.config.module_list.forEach(function(element) {
						var wordIncluded = false;					
						element.words.forEach(function(word){
							if(transcript.includes(word))
								wordIncluded = true	});
						if (wordIncluded)
							MM.getModules().withClass(element.name).enumerate(function(module) {
								if (module.hidden) 
								module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
								else 
								module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"})
							});
					});
				}		
			}else if(this.mainManuState === this.mainManuStateObj.smarthome){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				} else if(transcript.includes('coffee')){
					this.sendNotification('MAIN_MENU', 'coffee');
					this.mainManuState = this.mainManuStateObj.coffee;
				}
			}else if(this.mainManuState === this.mainManuStateObj.coffee){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'smarthome');
					this.mainManuState = this.mainManuStateObj.smarthome;
				} else if (transcript.includes('stats')) {
					this.config.module_list.forEach(function(element) {
						var wordIncluded = false;					
						element.words.forEach(function(word){
							if(word == "coffeebot")
								wordIncluded = true	});
						if (wordIncluded)
							MM.getModules().withClass(element.name).enumerate(function(module) {
								if (module.hidden) 
								module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
								else 
								module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"})
							});
					});			

				} else {
				
					var d = new Date();
					if(d.getTime() - this.timeOfLastCoffee > 30000){
					
						this.timeOfLastCoffee = d.getTime();
						this.sendNotification('smartmirror-TTS-ger',"Ich sage es der Kaffe Maschine. Denk an deine Tasse bitte!");
						this.sendNotification("SHOW_ALERT", {type: "notification", message: "Kaffee kommt! Stell sicher, dass eine Tasse drunter steht!"});

						if (transcript.includes('singlecoffee')){
							this.sendNotification('COFFEBOT_MAKE', 'COFFEE');
						} else if (transcript.includes('doublecoffee')){
							this.sendNotification('COFFEBOT_MAKE', 'COFFEE_DOUBLE');
						} else if (transcript.includes('espresso')){
							this.sendNotification('COFFEBOT_MAKE', 'ESPRESSO');
						} else if (transcript.includes('doubleespresso')){
							this.sendNotification('COFFEBOT_MAKE', 'ESPRESSO_DOUBLE');
						}
					}else{
						this.sendNotification('smartmirror-TTS-ger',"Dein Kaffe ist noch nicht durch!");
					}
				}
	
			}else if(this.mainManuState === this.mainManuStateObj.preferences){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				} else if(transcript.includes('user')){
					this.sendNotification('MAIN_MENU', 'user_settings');
					this.mainManuState = this.mainManuStateObj.user_settings;
				}
			}else if(this.mainManuState === this.mainManuStateObj.user_settings){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.preferences;
				}
			}

		}
	},

	process_gestures_object: function(gesture_json_obj){
		var self = this;

		if (Object.keys(gesture_json_obj['DETECTED_GESTURES']).length == 0){
			self.flat_right_id = -1
			return
		}

		Object.keys(gesture_json_obj['DETECTED_GESTURES']).forEach(function (item) {
			if (gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "flat_right"){
				if (self.flat_right_id == -1){
					console.log("[" + self.name + "]  first flat right with id: " + parseInt(gesture_json_obj['DETECTED_GESTURES'][item]["TrackID"]));
					self.flat_right_id = parseInt(gesture_json_obj['DETECTED_GESTURES'][item]["TrackID"])
					self.lastHightOfFlatRight = gesture_json_obj['DETECTED_GESTURES'][item]["center"][1]
				}else{
					if(self.flat_right_id == parseInt(gesture_json_obj['DETECTED_GESTURES'][item]["TrackID"])){
						if( gesture_json_obj['DETECTED_GESTURES'][item]["center"][1] > self.lastHightOfFlatRight + 0.01){
							self.sendNotification('MAIN_MENU_DOWN');
							self.lastHightOfFlatRight = gesture_json_obj['DETECTED_GESTURES'][item]["center"][1]
						}else if( gesture_json_obj['DETECTED_GESTURES'][item]["center"][1] < self.lastHightOfFlatRight - 0.01){
							self.sendNotification('MAIN_MENU_UP');
							self.lastHightOfFlatRight = gesture_json_obj['DETECTED_GESTURES'][item]["center"][1]
					
						}
					}
				}
				
			}else if (gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "okay_right"){
				console.log("[" + self.name + "] okay_right clicked with id:  " + gesture_json_obj['DETECTED_GESTURES'][item]["TrackID"] );
				var d = new Date();
				if(d.getTime() - self.timeOfLastOkay > 1000){
					self.sendNotification('MAIN_MENU_CLICK_SELECTED');
					self.timeOfLastOkay = d.getTime();
				}
			}
				
		});
		
	},

	process_gesture: function(detection_string){
		console.log("[" + this.name + "] " + "gesture detected: " + detection_string);
		var parsed_detection = JSON.parse(detection_string)

		if ((parsed_detection["name"] === "flat_right")){
			var d = new Date();

			var a = parsed_detection["center"][0];
			var b = parsed_detection["center"][1];

			
			if (d.getTime() - this.timeOfLastFlatRight < 10000){
				if (a < this.lastHightOfFlatRight){
					this.sendNotification('MAIN_MENU_UP');
				}else if (a > this.lastHightOfFlatRight){
					this.sendNotification('MAIN_MENU_DOWN');
				}
			}
			this.lastHightOfFlatRight = a;
			this.timeOfLastFlatRight = d.getTime();
			
		}else if ((parsed_detection["name"] === "okay_right")){
			var d = new Date();
			if(d.getTime() - this.timeOfLastOkay > 1000){
				this.sendNotification('MAIN_MENU_CLICK_SELECTED');
				this.timeOfLastOkay = d.getTime();
			}	
		}else if (parsed_detection["name"] === "thumbs_up_right" || parsed_detection["name"] === "thumbs_up_left"){
			this.sendNotification('MAIN_MENU_UP');
		}else if (parsed_detection["name"] === "thumbs_down_right" || parsed_detection["name"] === "thumbs_down_left"){
			this.sendNotification('MAIN_MENU_DOWN');
		}
	},

	disable_speechrec: function(){
		this.sendNotification('SPEECHREC_AKTIV',false);
		this.speechrec_aktiv = false;	
	},

	start_idle_ai_mirror_art: function(){
	 	 if(this.currentuserid == -1) {
		 if (this.aiartmirrorshown == false){
		MM.getModules().withClass("smartmirror-center-display").enumerate(function(module) {
			module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
		});
		this.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
		this.aiartmirrorshown = true;
		this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 25.0);
		}
		} 
	} 
});
