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

	numberOfRecognisedPersons: 0,
	currentuserid: -1,
	currentpersonTrackID : -1,

	facerecognitionshown: false,
	objectdetectionshown: false,
	gesturerecognitionshown: false,
	personrecognitionshown: false,
	aiartmirrorshown: false,
	aiartmirrorshown_random: true,

	speechrec_aktiv: false,

	flat_right_id : -1,

	timeOfLastFlatRight : 0,
	timeOfLastFlatLeft : 0,
	timeOfLastOkay : 0,
	lastHightOfFlatRight : 0,
	lastHightOfFlatLeft : 0,
	timeOfLastOneRight : 0,

	timeOFLastGreet: 0,
	timebetweenGreets: 50000,

	timeOfLastCoffee: 0,
	timeOFLastPicture: 0,
	print_ui: false,

	defaults: {
	
		print_cewe: true,
	
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
			{name : "smartmirror-coffeebot", words : ["coffee","coffeebot"]},
			{name : "smartmirror-print-cewe", words : ["print_cewe"]}
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
		}else if(notification === 'RECOGNIZED_PERSONS') {
			this.process_rec_person(payload.RECOGNIZED_PERSONS);
		}else if (notification === 'ALL_MODULES_STARTED') {
			this.sendSocketNotification('LOGGIN_USER', -1);
			this.sendNotification('smartmirror-TTS-en',"Welcome to the smart mirror!");
			//setTimeout(() => {this.start_idle_ai_mirror_art();}, 10000);
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
		}else if (notification === 'PRINT_UI_DONE') {
			if (this.currentuserid != -1)
				this.sendSocketNotification('LOGGIN_USER', this.currentuserid);
			else
				this.print_ui = false
			if (this.aiartmirrorshown_random == true){
				this.sendNotification('smartmirror-ai-art-mirror','RANDOM_STYLE');
			}
		}
	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if(notification === 'LOGGIN_USER_INFOS') {
			//console.log("[" + this.name + "] " + "User data received: " + JSON.stringify(JSON.parse(payload)[0]["language"]));	
			//console.log("test " + JSON.parse(payload)[0])
			
			if (JSON.parse(payload)[0]["ID"] == -2) {
				self.print_ui = true;
			}

			this.adjustViewLogin((JSON.parse(payload))[0]);
			
	
			if (JSON.parse(payload)[0]["ID"] > 0) {
				
				//this.sendNotification('smartmirror-TTS-en',"Hello, nice to see you");
				var d = new Date();
				if((d.getTime() - this.timeOFLastGreet > this.timebetweenGreets) && (self.print_ui != true)){
					this.sendSocketNotification("GREET_USER",[JSON.parse(payload)[0]["language"],JSON.parse(payload)[0]["name"]])
					this.timeOFLastGreet = d.getTime();   
				}
				self.print_ui = false	
			}else if (JSON.parse(payload)[0]["ID"] == -1) {
				//if nodody is in front of the mirror close everything
				//menu closed..
				this.sendNotification('MAIN_MENU', 'none');
				this.mainManuState = this.mainManuStateObj.none;
				//center display closed..
				self.remove_everything_center_display();
				setTimeout(() => {this.start_idle_ai_mirror_art();}, 10000);	
				self.print_ui = false				
			}
			this.adjust_detection_fps();
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

		if((self.aiartmirrorshown == true) && (self.print_ui == false)){
			self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
			self.aiartmirrorshown = false;
			self.adjust_detection_fps();

		}

		self.config.module_list.forEach(function(element) {
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

	process_rec_person: function(persons){
		// example:  {"1": {"TrackID": 522, "face": {"confidence": 0.9970833725349748, "w_h": [0.1037, 0.09167], "TrackID": 282, "center": [0.52222, 0.59375], "id": 4, "name": "Nils"}, "w_h": [0.375, 0.40625], "name": "person", "center": [0.4963, 0.72083]}}

		if(this.print_ui == true)
			return

		if (this.numberOfRecognisedPersons != Object.keys(persons).length){
			this.numberOfRecognisedPersons = Object.keys(persons).length
			setTimeout(() => {this.check_for_user_idle();}, 3000);
			this.adjust_detection_fps();
		}

		var login_id = -1;
		if (Object.keys(persons).length != 0){
			if (persons.hasOwnProperty(this.currentpersonTrackID))
				if (persons[this.currentpersonTrackID].hasOwnProperty('face'))
					login_id = persons[this.currentpersonTrackID].face.id

			if (login_id < 1) {
				for(var key in persons)
					if (persons[key].hasOwnProperty('face')){
						login_id = persons[key].face.id;
						this.currentpersonTrackID = persons["TrackID"];
						if (login_id > 0) {
							break;
						}
					}
			}
		} 

		if (login_id != this.currentuserid){
			this.sendSocketNotification('LOGGIN_USER', login_id);
			this.currentuserid = login_id;
			console.log("[" + this.name + "] changing current user to: " + login_id );
		}
	},

	adjust_detection_fps: function(){
		if (this.objectdetectionshown) {
			this.sendNotification("smartmirror-object-detection" + "SetFPS", 25.0);
		} else {
			this.sendNotification("smartmirror-object-detection" + "SetFPS", 3.0)
		}
		if (this.gesturerecognitionshown) {
			this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 25.0);
		} else {
			if (this.currentuserid == -1)
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 0.0);
			else
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 4.0);
		}
		if (this.facerecognitionshown) {
			this.sendNotification("smartmirror-facerecognition" + "SetFPS", 25.0);
		} else {
			if (this.numberOfRecognisedPersons == 0)
				this.sendNotification("smartmirror-facerecognition" + "SetFPS", 0.0);
			else if (this.currentuserid < 1)
				this.sendNotification("smartmirror-facerecognition" + "SetFPS", 3.0);
			else
				this.sendNotification("smartmirror-facerecognition" + "SetFPS", 2.0);
		}
		if (this.aiartmirrorshown) {
			if (this.numberOfRecognisedPersons == 0) {
				this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 5.0);
			} else {
				this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 25.0);
			}
		} else {
			this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 0.0);
		}

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
					this.adjust_detection_fps();
					
				}else if(transcript.includes('gesture')||transcript.includes('hand')){				
					this.sendNotification('CENTER_DISPLAY', 'GESTURE');
					this.gesturerecognitionshown = !(this.gesturerecognitionshown);
					this.adjust_detection_fps();
				}else if(transcript.includes('face')||transcript.includes('gesicht')){				
					this.sendNotification('CENTER_DISPLAY', 'FACE');
					this.facerecognitionshown = !(this.facerecognitionshown); 
					this.adjust_detection_fps();
				}else if(transcript.includes('person')||transcript.includes('person')){
					this.sendNotification('CENTER_DISPLAY', 'PERSON');
					this.personrecognitionshown = !(this.personrecognitionshown);
					
				}else if(transcript.includes('hide all')||transcript.includes('hideALL')||transcript.includes('versteck alles')||transcript.includes('remove all')){
					self.remove_everything_center_display();
						
				}else if(transcript.includes('show all')||transcript.includes('showALL')){
					this.sendNotification('CENTER_DISPLAY', 'SHOWALL');
					this.facerecognitionshown = true;
					this.objectdetectionshown = true;
					this.gesturerecognitionshown = true;
					this.adjust_detection_fps();		
				}
			}else if(this.mainManuState === this.mainManuStateObj.augmentations){
				if(transcript.includes('back')||transcript.includes('zurück')){		
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}else if(transcript.includes('aiartmiror')||transcript.includes('ai')||transcript.includes('mirror')||transcript.includes('art')) {
					this.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
					this.aiartmirrorshown = ! this.aiartmirrorshown;
					this.adjust_detection_fps();
				}else if(transcript.includes('randomsytle')) {
					this.sendNotification('smartmirror-ai-art-mirror','RANDOM_STYLE');
					this.aiartmirrorshown_random = ! this.aiartmirrorshown_random;
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
						if( gesture_json_obj['DETECTED_GESTURES'][item]["center"][1] > self.lastHightOfFlatRight + 0.03){
							self.sendNotification('MAIN_MENU_DOWN');
							self.lastHightOfFlatRight = self.lastHightOfFlatRight + 0.02
						}else if( gesture_json_obj['DETECTED_GESTURES'][item]["center"][1] < self.lastHightOfFlatRight - 0.03){
							self.sendNotification('MAIN_MENU_UP');
							self.lastHightOfFlatRight = self.lastHightOfFlatRight - 0.02
					
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
			}else if (gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "one_right"){
				var d = new Date();				
				self.timeOfLastOneRight = d.getTime();

			}else if (gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "two_right"){
				var d = new Date();				
			/*	if((d.getTime() - self.timeOfLastOneRight < 2000) && (d.getTime() - self.timeOFLastPicture > 10000)){
					self.sendNotification('smartmirror-TTS-en',"say cheeesse");
					self.timeOFLastPicture = d.getTime();
					self.timeOfLastOneRight = 0;
					self.sendNotification('PRINT_UI');
					if (self.currentuser != -1)
						self.sendSocketNotification('LOGGIN_USER', -2);
					if (self.aiartmirrorshown_random == true){
						self.sendNotification('smartmirror-ai-art-mirror','RANDOM_STYLE');
					}
				}*/
			}else if (gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "thumbs_up_right"){
				
				if ((self.facerecognitionshown === false) || (self.objectdetectionshown === false) || (self.gesturerecognitionshown === false )) {
					if(self.aiartmirrorshown){
						self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
						self.aiartmirrorshown = false;
					}				
					console.log("[" + self.name + "] show all..." );
					self.sendNotification('CENTER_DISPLAY', 'SHOWALL');
					self.facerecognitionshown = true;
					self.objectdetectionshown = true;
					self.gesturerecognitionshown = true;
					self.adjust_detection_fps();
				}
			}else if (gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "thumbs_up_left"){
				if (self.aiartmirrorshown === false) {
					self.remove_everything_center_display();
					self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
					self.aiartmirrorshown = true;
					self.adjust_detection_fps();
				}
			}else if ((gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "thumbs_down_left") || (gesture_json_obj['DETECTED_GESTURES'][item]["name"] === "thumbs_down_right")){
				if(self.facerecognitionshown || self.objectdetectionshown || self.gesturerecognitionshown || self.personrecognitionshown || self.aiartmirrorshown ){
					self.remove_everything_center_display();
				}
			}
				
		});
		
	},

	disable_speechrec: function(){
		this.sendNotification('SPEECHREC_AKTIV',false);
		this.speechrec_aktiv = false;	
	},

	remove_everything_center_display: function(){
		self = this;
		self.sendNotification('CENTER_DISPLAY', 'HIDEALL');
		self.facerecognitionshown = false;
		self.objectdetectionshown = false;
		self.gesturerecognitionshown = false;
		self.personrecognitionshown = false;
		self.aiartmirrorshown = false;
		self.adjust_detection_fps();
	},

	check_for_user_idle: function(){
		self = this;
		if(self.numberOfRecognisedPersons == 0){
			if(self.currentuserid != -1){
				self.sendSocketNotification('LOGGIN_USER', -1);
			}
		}
	},

	start_idle_ai_mirror_art: function(){
	 	if(this.currentuserid == -1) {
			if (this.aiartmirrorshown == false){
				MM.getModules().withClass("smartmirror-center-display").enumerate(function(module) {
					module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
				});
				this.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
				this.aiartmirrorshown = true;
				this.adjust_detection_fps();
				this.sendNotification("SHOW_ALERT", {type: "notification", message: "showing ai art as idle screen!"});
			}
		} 
	} 
});
