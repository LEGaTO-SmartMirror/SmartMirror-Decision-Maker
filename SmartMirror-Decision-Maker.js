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
		main: 0,
		camera:1,
		augmentations:2,
		messevideo:3,
		application:4,
		smarthome:5,
		coffee:6,
		preferences:7,
		user_settings:8,
		utilities:9,
		campus:10,
		entertainment:11
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
	cameraimageshown: false,
	shortdistanceshown: false,

	flatRightDetected : false,
	lastTimeFlatRight: null,
	lastXOfFlatRight : 0,
	lastYOfFlatRight : 0,

	timeOFLastGreet: 0,
	timebetweenGreets: 50000,

	timeOfLastCoffee: 0,
	timeOFLastPicture: 0,
	selfieOngoing: false,

	MainMenuItems: [],
	MainMenuItemsAmount: 0,
	MainMenuSelected: -1,
	MainMenuSelectedLast: -1,
	MainMenuItemSize: 0.07,//0.0375,
	MainMenuSelectedTime: 0,

	newsNextLastTime: {timestamp: undefined},
	newsDetailLastTime: {timestamp: undefined},
	mainMenuShowLastTime: {timestamp: undefined},
	mainMenuHideLastTime: {timestamp: undefined},
	showAllLastTime: {timestamp: undefined},
	hideAllLastTime : {timestamp: undefined},
	aiArtLastTime: {timestamp: undefined},
	userLoginChangeLastTime: {timestamp: undefined},
	printLastTime: {timestamp: undefined},
	newsScrollUpLastTime: {timestamp: undefined},
	newsScrollDownLastTime: {timestamp: undefined},
	gamesNextLastTime: {timestamp: undefined},

	Debug_infos: {},

	readingMode : false,
	applicationsViewStates: [],
	applicationClass: [
		"clock",
		"calendar", 
		// "smartmirror-speechrecognition",
		"MMM-cryptocurrency",
		"weatherforecast",
		"currentweather", 
		"newsfeed",
		"MMM-SimpleLogo", 
		"MMM-PublicTransportHafas", 
		"MMM-TomTomTraffic", 
		"smartmirror-mensa-plan", 
		"smartmirror-bivital", 
		"MMM-SoccerLiveScore",
		"MMM-News",
		"MMM-Canteen",
		"MMM-Liquipedia-Dota2",
		"MMM-DailyDilbert",
		"MMM-Fuel",
		"MMM-ITCH-IO",
		"weatherforecast"
	],


//----------------------------------------------------------------------//
// CONFIG DEFAULTS
//----------------------------------------------------------------------//
	defaults: {
	
		ai_art_mirror: true,

		maxDetFPS: 30.0,
	
		module_list: [
			{name : "clock", words : ["clock","uhr"]},
			{name : "calendar", words : ["calendar"]},
			{name : "smartmirror-speechrecognition", words : ["speech"]},
			{name : "MMM-cryptocurrency", words : ["crypto"]},
			{name : "weatherforecast", words : ["wforecast"]},
			{name : "currentweather", words : ["weather","wetter"]},
			{name : "newsfeed", words : ["news feed" , "newsfeed"]},
			{name : "MMM-SimpleLogo", words : ["legato-logo"]},
			{name : "MMM-PublicTransportHafas", words : ["transportation"]},
			{name : "MMM-TomTomTraffic", words : ["traffic"]},
			{name : "smartmirror-mensa-plan", words : ["mensa"]},
			{name : "smartmirror-main-menu", words : ["menu"]},
			{name : "SmartMirror-Main-Menu-Center", words : ["menu-center"]},
			{name : "smartmirror-center-display", words : ["centerdisplay"]},
			{name : "smartmirror-bivital", words: ["bivital"]},
			{name : "MMM-SoccerLiveScore", words: ["soccer"]},
			{name : "MMM-News", words : ["news"]},
			{name : "MMM-Canteen", words : ["canteen"]},
			{name : "MMM-Fuel", words : ["fuel", "gas"]},
			{name : "MMM-DailyDilbert", words : ["comic"]},
			{name : "MMM-Liquipedia-Dota2", words : ["esports", "dota2"]},
			{name : "MMM-ITCH-IO", words : ["games"]},
			{name : "smartmirror-coffeebot", words : ["coffee","coffeebot"]},
			{name : "SmartMirror-Decision-Maker", words : ["Decision_maker"]},
			{name : "SmartMirror-Image-Handler", words :["image_handler"]}
		],
		speechrec_hotword: ["jarvis","smartmirror"]
	},

//----------------------------------------------------------------------//
// START FUNKTION
//----------------------------------------------------------------------//
	start: function() {
		this.currentuserid = -1;
		console.log(this.name + " has started...");
		this.sendNotification('MAIN_MENU', 'menu');
		this.mainManuState = this.mainManuStateObj.main;
		console.log("[" + this.name + "] " + "sending MAIN_MENU: none");
		this.sendSocketNotification('CONFIG', this.config);
		this.Debug_infos['max detection fps'] = this.config.maxDetFPS;
		//config.language = "de";
		//Translator.loadCoreTranslations(config.language);

	},


//----------------------------------------------------------------------//
// NOTIFICATION HANDLER
//----------------------------------------------------------------------//
	notificationReceived: function(notification, payload, sender) {

		var self = this;

		// Debug infos can allways be installed
		switch (notification) {
			case 'CENTER_DISPLAY_FPS':
				this.Debug_infos['center display fps'] = payload;
				this.updateDom();
				return;
			case 'CAMERA_FPS':
				this.Debug_infos['camera fps'] = payload;
				this.updateDom();
				return;
			case 'FACE_DET_FPS':
				this.Debug_infos['face recognition fps'] = payload;
				this.updateDom();
				return;
			case 'OBJECT_DET_FPS':
				this.Debug_infos['object recognition fps'] = payload;
				this.updateDom();
				return;
			case 'GESTURE_DET_FPS':
				this.Debug_infos['gesture recognition fps'] = payload;
				this.updateDom();
				return;
			case 'IMAGE_HANDLER_FPS':
				this.Debug_infos['image hander fps'] = payload;
				this.updateDom();
				return;
			case 'AI_ART_FPS':
				this.Debug_infos['ai art fps'] = payload;
				this.updateDom();
				return;
			case 'BIVITAL_CONNECTED':
				this.Debug_infos['BiVital Connected'] = true;
				this.updateDom();
				return;
			case 'BIVITAL_DISCONNECTED':
				this.Debug_infos['BiVital Connected'] = false;
				this.updateDom();
				return;
		}

		//no controle if a selfie is made!
		//just return and ignor all changes
		if (self.selfieOngoing == true){
			return;
		}
		
		// all control messages
		switch (notification) {
			case 'TRANSCRIPT_EN':
				console.log("[" + this.name + "] " + "transcript received: " + payload);
				this.process_string(payload);
				return;
			case 'TRANSCRIPT_DE':
				console.log("[" + this.name + "] " + "transcript received: " + payload);
				this.process_string(payload)
				return;
			case 'MENU_ITEMS':
				console.log("[" + this.name + "] " + "Menu item has the following items: " + payload);
				this.MainMenuItems = payload;
				this.MainMenuItemsAmount = payload.length;
				return;
			case 'MENU_CLICKED':
				console.log("[" + this.name + "] " + "Menu item was clicked: " + payload);
				this.process_string(payload)
				return;
			case 'RECOGNIZED_PERSONS':
				this.process_rec_person(payload.RECOGNIZED_PERSONS);
				return;
			case 'ALL_MODULES_STARTED':
				this.sendSocketNotification('LOGGIN_USER', -1);
				this.sendNotification('smartmirror-TTS-en',"Welcome to the smart mirror!");
				//setTimeout(() => {this.start_idle_ai_mirror_art();}, 10000);
				setTimeout(() => {this.logDataPoints();}, 10000);
				return;
			case 'DOM_OBJECTS_CREATED':
				MM.getModules().enumerate(function(module) {
				if (module.name != "MMM-TomTomTraffic") {
					module.hide(0, function() {
						Log.log('Module is hidden.');
					}, {lockString: "lockString"});
					setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: module.name, visibility: false});}, 500)
				} else {
					setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: "MMM-TomTomTraffic", visibility: true});}, 500)
				}
				});
				return;
		}		
	},

//----------------------------------------------------------------------//
// Log Data points for data augmentation (Master Thesis)
//----------------------------------------------------------------------//
	logDataPoints: function(){
		self = this
		var nextLogInSeconds = Math.floor(Math.random() * 40) + 5;

		self.sendNotification('FAKE_INTERACTION')
		setTimeout(() => {self.logDataPoints();}, nextLogInSeconds * 1000)
	},
//----------------------------------------------------------------------//
// SOCKET NOTIFICATION HANDLER
//----------------------------------------------------------------------//
	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if(notification === 'LOGGIN_USER_INFOS') {
			//console.log("[" + this.name + "] " + "User data received: " + JSON.stringify(JSON.parse(payload)[0]["language"]));	
			//console.log("test " + JSON.parse(payload)[0])
			
			this.adjustViewLogin((JSON.parse(payload))[0]);
			
	
			if (JSON.parse(payload)[0]["ID"] > 0) {
				
				//this.sendNotification('smartmirror-TTS-en',"Hello, nice to see you");
				var d = new Date();
				if((d.getTime() - this.timeOFLastGreet > this.timebetweenGreets)){
					this.sendSocketNotification("GREET_USER",[JSON.parse(payload)[0]["language"],JSON.parse(payload)[0]["name"]])
					this.timeOFLastGreet = d.getTime();   
				}
			}else if (JSON.parse(payload)[0]["ID"] == -1) {
				//if nodody is in front of the mirror close everything
				//menu closed..
				this.sendNotification('MAIN_MENU', 'menu');
				this.mainManuState = this.mainManuStateObj.main;
				//center display closed..
				self.remove_everything_center_display();
				if(self.config.ai_art_mirror == true){
					setTimeout(() => {this.start_idle_ai_mirror_art();}, 10000);
				}	
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

//----------------------------------------------------------------------//
// VIEW ADJUSTMENT FOR NEW USER
//----------------------------------------------------------------------//
	adjustViewLogin: function(user_config){
		var self = this;

		if((self.aiartmirrorshown == true)){
			self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
			self.aiartmirrorshown = false;
			self.adjust_detection_fps();
		}

		this.sendNotification('USER_MODULE_VISIBILITY_CONFIG', user_config)

		self.config.module_list.forEach(function(element) {
			for(var key in user_config){
				if(element.words.includes(key)){
					MM.getModules().withClass(element.name).enumerate(function(module) {
					if(user_config[key]) {
						if (module.hidden){
							module.show(1000, function() {Log.log(module.name + ' is shown.');},{lockString: "lockString"});
							setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: module.name, visibility: true});}, 500)
						}
							
					}else{
						 if(!module.hidden){
							module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"})
							setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: module.name, visibility: false});}, 500)
						}
					}					
					});
				}
			}
		});
	},

//----------------------------------------------------------------------//
// PROCESS RECEIVED PERSON JASON
// must decide who is logged in
//----------------------------------------------------------------------//
	process_rec_person: function(persons){
		var self = this;
		// example:  {"1": {"TrackID": 522, "face": {"confidence": 0.9970833725349748, "w_h": [0.1037, 0.09167], "TrackID": 282, "center": [0.52222, 0.59375], "id": 4, "name": "Nils"}, "w_h": [0.375, 0.40625], "name": "person", "center": [0.4963, 0.72083]}}

		//console.log("[" + this.name + "] process_rec_person triggered " +  JSON.stringify(persons));


		if (self.numberOfRecognisedPersons != Object.keys(persons).length){
			self.numberOfRecognisedPersons = Object.keys(persons).length
			//setTimeout(() => {this.check_for_user_idle();}, 3000);
			
			if(self.numberOfRecognisedPersons == 0){
				if(self.currentuserid != -1){
					self.sendSocketNotification('LOGGIN_USER', -1);
				}
			}
			self.adjust_detection_fps();
		}

		var login_id = -1;
		if (Object.keys(persons).length != 0){
			//console.log("test "+ this.currentpersonTrackID + "        " + JSON.stringify(persons))
			if (persons.hasOwnProperty(self.currentpersonTrackID)){
				//console.log(persons[this.currentpersonTrackID])
				if (persons[self.currentpersonTrackID].hasOwnProperty('face'))
					login_id = persons[self.currentpersonTrackID].face.id
				if (persons[self.currentpersonTrackID].hasOwnProperty('gestures')) {
					self.process_gestures_object(persons[self.currentpersonTrackID].gestures);
					//console.log("[" + this.name + "] ceck gestures");
				} else {
					self.process_gestures_object([]);
				}
			}

			if (login_id < 1) {
				for(var key in persons)
					if (persons[key].hasOwnProperty('face')){
						login_id = persons[key].face.id;
						self.currentpersonTrackID = key; //persons["TrackID"];
						if (login_id > 0) {
							break;
						}
					}
			}
		} 


		if (login_id != self.currentuserid){
			self.sendSocketNotification('LOGGIN_USER', login_id);
			self.currentuserid = login_id;
			console.log("[" + self.name + "] changing current user to: " + login_id );
			self.sendNotification('USER_LOGIN', login_id);
			if(self.readingMode){
				self.readingMode = false
				self.leaveReadingMode()
			}
			setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: false});}, 500)
		}
	},

//----------------------------------------------------------------------//
// ADJUST FPS COUNTER FOR ALL IMAGE MODULES
// can be turned down if not shown
//----------------------------------------------------------------------//
	adjust_detection_fps: function(){
		if (this.objectdetectionshown) {
			this.sendNotification("smartmirror-object-detection" + "SetFPS", this.config.maxDetFPS);
		} else {
			this.sendNotification("smartmirror-object-detection" + "SetFPS", 4.0)
		}
		if (this.gesturerecognitionshown) {
			this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", this.config.maxDetFPS);
		} else {
			if (this.currentuserid == -1)
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 0.0);
			else
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 5.0);
		}
		if (this.facerecognitionshown) {
			this.sendNotification("smartmirror-facerecognition" + "SetFPS", this.config.maxDetFPS);
		} else {
			if (this.numberOfRecognisedPersons == 0)
				this.sendNotification("smartmirror-facerecognition" + "SetFPS", 0.0);
			else
				this.sendNotification("smartmirror-facerecognition" + "SetFPS", 4.0);
		}
		if (this.aiartmirrorshown) {
			if (this.numberOfRecognisedPersons == 0) {
				this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 10.0);
			} else {
				this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 30.0);
			}
		} else {
			this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 0.0);
		}

	},
	
//----------------------------------------------------------------------//
// STRING PROCESSING
// can be received by menu or speech recognition
//----------------------------------------------------------------------//
	process_string: function(transcript){
		if (typeof transcript === 'string'){
			var self = this

			if(transcript.includes('shutdown') || transcript.includes('sudo') || transcript.includes('reboot')){
				self.sendNotification('smartmirror-TTS-en', "Thorsten no! Stop it!");
				self.sendNotification('smartmirror-TTS-ger', "Genau Thorsten! Lass es sein!");
			}else if(transcript.includes('fuck')){
				self.sendNotification('smartmirror-TTS-en', "language please!");
			}

			switch (self.mainManuState){
				case self.mainManuStateObj.main: // switch (self.mainManuState)
					if(transcript.includes('camera')||transcript.includes('kamera')||transcript.includes('demonstration')||transcript.includes('detections')){				
						self.sendNotification('MAIN_MENU', 'camera');
						self.mainManuState = self.mainManuStateObj.camera;
					}else if(transcript.includes('image')||transcript.includes('augmentations')){				
						self.sendNotification('MAIN_MENU', 'augmentations');
						self.mainManuState = self.mainManuStateObj.augmentations;
					}else if(transcript.includes('messe')||transcript.includes('video')||transcript.includes('messevideo')){				
						self.sendNotification('MAIN_MENU', 'messevideo');
						self.mainManuState = self.mainManuStateObj.messevideo;
					}else if(transcript.includes('application')||transcript.includes('anwendung')){				
						self.sendNotification('MAIN_MENU', 'application');
						self.mainManuState = self.mainManuStateObj.application;
					}else if(transcript.includes('utilities')||transcript.includes('nützliches')){				
						self.sendNotification('MAIN_MENU', 'utilities');
						self.mainManuState = self.mainManuStateObj.utilities;
					}else if(transcript.includes('campus')||transcript.includes('kampus')){				
						self.sendNotification('MAIN_MENU', 'campus');
						self.mainManuState = self.mainManuStateObj.campus;
					}else if(transcript.includes('entertainment')||transcript.includes('unterhaltung')){				
						self.sendNotification('MAIN_MENU', 'entertainment');
						self.mainManuState = self.mainManuStateObj.entertainment;
					}else if(transcript.includes('smarthome')){				
						self.sendNotification('MAIN_MENU', 'smarthome');
						self.mainManuState = self.mainManuStateObj.smarthome;
					}else if(transcript.includes('preference')||transcript.includes('einstellung')){				
						self.sendNotification('MAIN_MENU', 'preferences');
						self.mainManuState = self.mainManuStateObj.preferences;
					}
					return;
				case self.mainManuStateObj.camera: // switch (self.mainManuState)
					if(transcript.includes('back')||transcript.includes('zurück')){				
						self.sendNotification('MAIN_MENU', 'menu');
						self.mainManuState = self.mainManuStateObj.main;
					}else if(transcript.includes('image')||transcript.includes('bild')){				
						self.sendNotification('CENTER_DISPLAY', 'TOGGLE');
						self.cameraimageshown = !self.cameraimageshown;
						setTimeout(() => {
							self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-camera-image', visibility: self.cameraimageshown});
							self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Short-Distance', visibility: self.shortdistanceshown});
						}, 500);
					}else if(transcript.includes('distance')||transcript.includes('distanz')){				
						self.sendNotification('CENTER_DISPLAY', 'DISTANCE');
						self.shortdistanceshown = !self.shortdistanceshown
						if(self.cameraimageshown){
							setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Short-Distance', visibility: self.shortdistanceshown});}, 500)
						}
					}else if(transcript.includes('object')){				
						self.sendNotification('CENTER_DISPLAY', 'OBJECT');
						self.objectdetectionshown = !(self.objectdetectionshown);
						self.adjust_detection_fps();
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Object-Detection', visibility: self.objectdetectionshown});}, 500)
					}else if(transcript.includes('gesture')||transcript.includes('hand')){				
						self.sendNotification('CENTER_DISPLAY', 'GESTURE');
						self.gesturerecognitionshown = !(self.gesturerecognitionshown);
						self.adjust_detection_fps();
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Gesture-Recognition', visibility: self.gesturerecognitionshown});}, 500)
					}else if(transcript.includes('face')||transcript.includes('gesicht')){				
						self.sendNotification('CENTER_DISPLAY', 'FACE');
						self.facerecognitionshown = !(self.facerecognitionshown); 
						self.adjust_detection_fps();
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-facerecognition', visibility: self.facerecognitionshown});}, 500)
					}else if(transcript.includes('person')||transcript.includes('person')){
						self.sendNotification('CENTER_DISPLAY', 'PERSON');
						self.personrecognitionshown = !(self.personrecognitionshown);
					}else if(transcript.includes('hide all')||transcript.includes('HIDEALL')||transcript.includes('versteck alles')||transcript.includes('remove all')){
						self.remove_everything_center_display();
							
					}else if(transcript.includes('show all')||transcript.includes('SHOWALL')){
						self.sendNotification('CENTER_DISPLAY', 'SHOWALL');
						self.facerecognitionshown = true;
						self.objectdetectionshown = true;
						self.gesturerecognitionshown = true;
						self.cameraimageshown = true;
						self.personrecognitionshown = true;
						self.adjust_detection_fps();
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-facerecognition', visibility: self.facerecognitionshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Object-Detection', visibility: self.objectdetectionshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Gesture-Recognition', visibility: self.gesturerecognitionshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-camera-image', visibility: self.cameraimageshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Person-Recognition', visibility: true});}, 500)	
					}
					return;
				case self.mainManuStateObj.augmentations: // switch (self.mainManuState)
					if(transcript.includes('back')||transcript.includes('zurück')){		
						self.sendNotification('MAIN_MENU', 'menu');
						self.mainManuState = self.mainManuStateObj.main;
					}else if(transcript.includes('aiartmiror')||transcript.includes('ai')||transcript.includes('mirror')||transcript.includes('art')) {
						self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
						self.aiartmirrorshown = ! self.aiartmirrorshown;
						self.adjust_detection_fps();
						setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: self.aiartmirrorshown});}, 500)
					}else if(transcript.includes('randomsytle')) {
						self.sendNotification('smartmirror-ai-art-mirror','RANDOM_STYLE');
						self.aiartmirrorshown_random = ! self.aiartmirrorshown_random;
					}else if(transcript.includes('nextsytle')) {
						self.sendNotification('smartmirror-ai-art-mirror','NEXT_STYLE');
					}else if(transcript.includes('prevsytle')) {
						self.sendNotification('smartmirror-ai-art-mirror','PREV_STYLE');
					}else if(transcript.includes('sourcesytle')) {
						self.sendNotification('smartmirror-ai-art-mirror','DISP_SOURCE');
	
					}
					return;
				case self.mainManuStateObj.utilities: // switch (self.mainManuState)
				case self.mainManuStateObj.campus: // switch (self.mainManuState)
				case self.mainManuStateObj.entertainment: // switch (self.mainManuState)
					if(transcript.includes('back')||transcript.includes('zurück')){				
						self.sendNotification('MAIN_MENU', 'menu');
						self.mainManuState = self.mainManuStateObj.main;
					} else {
						self.config.module_list.forEach(function(element) {
							var wordIncluded = false;					
							element.words.forEach(function(word){
							if(transcript.includes(word))
								wordIncluded = true	});
						if (wordIncluded)
							MM.getModules().withClass(element.name).enumerate(function(module) {
								if (module.hidden) {
									module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
									setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: module.name, visibility: true});}, 500)
								}
								else {
									module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
									setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: module.name, visibility: false});}, 500)
								}
								
							});
						});
					}	
					return;	
				case self.mainManuStateObj.smarthome: // switch (self.mainManuState)
					if(transcript.includes('back')||transcript.includes('zurück')){				
						self.sendNotification('MAIN_MENU', 'menu');
						self.mainManuState = self.mainManuStateObj.main;
					} else if(transcript.includes('coffee')){
						self.sendNotification('MAIN_MENU', 'coffee');
						self.mainManuState = self.mainManuStateObj.coffee;
					}
					return;
				case self.mainManuStateObj.coffee: // switch (self.mainManuState)
					if(transcript.includes('back')||transcript.includes('zurück')){				
						self.sendNotification('MAIN_MENU', 'smarthome');
						self.mainManuState = self.mainManuStateObj.smarthome;
					} else if (transcript.includes('stats')) {
						self.config.module_list.forEach(function(element) {
						var wordIncluded = false;					
						element.words.forEach(function(word){
							if(word == "coffeebot")
								wordIncluded = true	});
						if (wordIncluded)
							MM.getModules().withClass(element.name).enumerate(function(module) {
								if (module.hidden) {
									module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
									setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: module.name, visibility: true});}, 500)
								}
								else {
									module.hide(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
									setTimeout(()=>{self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: module.name, visibility: false});}, 500)
								}
							});
					});			

					} else {
				
						var d = new Date();
						if(d.getTime() - self.timeOfLastCoffee > 30000){
						
							self.timeOfLastCoffee = d.getTime();
							self.sendNotification('smartmirror-TTS-ger',"Ich sage es der Kaffe Maschine. Denk an deine Tasse bitte!");
							self.sendNotification("SHOW_ALERT", {type: "notification", message: "Kaffee kommt! Stell sicher, dass eine Tasse drunter steht!"});

							if (transcript.includes('singlecoffee')){
								self.sendNotification('COFFEBOT_MAKE', 'COFFEE');
							} else if (transcript.includes('doublecoffee')){
								self.sendNotification('COFFEBOT_MAKE', 'COFFEE_DOUBLE');
							} else if (transcript.includes('espresso')){
								self.sendNotification('COFFEBOT_MAKE', 'ESPRESSO');
							} else if (transcript.includes('doubleespresso')){
								self.sendNotification('COFFEBOT_MAKE', 'ESPRESSO_DOUBLE');
							}
						}else{
							self.sendNotification('smartmirror-TTS-ger',"Dein Kaffe ist noch nicht durch!");
						}
					}
					return;
				case self.mainManuStateObj.preferences: // switch (self.mainManuState)
					if(transcript.includes('back')||transcript.includes('zurück')){				
						self.sendNotification('MAIN_MENU', 'menu');
						self.mainManuState = self.mainManuStateObj.main;
					} else if(transcript.includes('user')){
						self.sendNotification('MAIN_MENU', 'user_settings');
						self.mainManuState = self.mainManuStateObj.user_settings;
					}
					return;
				case self.mainManuStateObj.user_settings: // switch (self.mainManuState)
					if(transcript.includes('back')||transcript.includes('zurück')){				
						self.sendNotification('MAIN_MENU', 'menu');
						self.mainManuState = self.mainManuStateObj.preferences;
					}
					return;
			}
		}
	},

//----------------------------------------------------------------------//
// PROCESS GESTURES OF LOGGED IN USER ONLY
//----------------------------------------------------------------------//
	process_gestures_object: function(gestures_list){
		var self = this;

		self.flatRightDetected = false;

		var d = new Date();

		gestures_list.forEach(function (item) {
			switch (item["name"]){
				case "flat_right":
					self.flatRightDetected = true;

					MM.getModules().withClass("smartmirror-main-menu-center").enumerate(function(module) {
						if (module.hidden && self.check_for_validity(self.mainMenuShowLastTime, 0.2, 1.4)){
							module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
							self.sendNotification('GESTURE_INTERACTION', 'menu_show') //send this notification when user desires to open the main menu via gesture
						}else if(!module.hidden){
							self.lastTimeFlatRight = new Date();
							self.lastYOfFlatRight = item["center"][1]
							self.lastXOfFlatRight = item["center"][0]

							var offset = 0.5 - (self.MainMenuItemSize * (self.MainMenuItemsAmount/2)) - 0.02;
	
							self.MainMenuSelected = -1;

							var i;
							for( i = 0; i < self.MainMenuItemsAmount; i ++){
								var a = (offset + i * self.MainMenuItemSize);
								var b = (offset + (i+1) * self.MainMenuItemSize)
			
								if(a < self.lastYOfFlatRight && self.lastYOfFlatRight < b ){
									self.MainMenuSelected = i;
									Log.log("MainMenuSelected ", self.MainMenuSelected) //alles außer -1
								}
							}
						}
					});
					break;
				case "thumbs_up_right":
				
					if (((self.facerecognitionshown === false) || (self.objectdetectionshown === false) || (self.gesturerecognitionshown === false )) 
					&& self.check_for_validity(self.showAllLastTime, 0.5, 2.5)) {
						if(self.aiartmirrorshown){
							self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
							self.aiartmirrorshown = false;
							setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: self.aiartmirrorshown});}, 500)
						}				
						console.log("[" + self.name + "] show all..." );
						self.sendNotification('CENTER_DISPLAY', 'SHOWALL');
						self.sendNotification('GESTURE_INTERACTION', 'SHOWALL'); //send this notification when user desires to toggle all camera options
						self.facerecognitionshown = true;
						self.objectdetectionshown = true;
						self.gesturerecognitionshown = true;
						self.cameraimageshown = true;
						self.personrecognitionshown = true;
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-facerecognition', visibility: self.facerecognitionshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Object-Detection', visibility: self.objectdetectionshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Gesture-Recognition', visibility: self.gesturerecognitionshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-camera-image', visibility: self.cameraimageshown});}, 500)
						setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Person-Recognition', visibility: true});}, 500)
						
						self.adjust_detection_fps();
					}
					break;
				case "thumbs_up_left":
					if (self.aiartmirrorshown === false && self.check_for_validity(self.aiArtLastTime, 0.5, 1.5)) {
						self.remove_everything_center_display();
						self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
						self.sendNotification('GESTURE_INTERACTION', 'STYLE_TRANSFERE'); //send this notification when user desires to turn air art on
						self.aiartmirrorshown = true;
						self.adjust_detection_fps();
						self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: self.aiartmirrorshown});
					}
					break;
				case "thumbs_down_left":
				case "thumbs_down_right":
					if (self.check_for_validity(self.hideAllLastTime, 0.5, 2.5))
					if(self.facerecognitionshown || self.objectdetectionshown || self.gesturerecognitionshown || self.personrecognitionshown || self.aiartmirrorshown ){
							self.remove_everything_center_display();
							self.sendNotification('GESTURE_INTERACTION', 'HIDEALL'); //send this notification when user desires to hide all camera options
					}
					break;
				case "okay_left":
					MM.getModules().withClass('MMM-News').enumerate(function(module) {
						if(!module.hidden && self.currentuserid != -1 && self.readingMode === false && self.check_for_validity(self.newsDetailLastTime, 0.5, 2.5)) {
							self.readingMode = undefined;
							self.enterReadingMode();
							setTimeout(() => {self.readingMode = true;}, 1000);
						
						} else if (module.hidden && self.readingMode === true && self.check_for_validity(self.newsDetailLastTime, 0.5, 2.5)) {
							self.readingMode = undefined;
							self.restoreView();
							self.leaveReadingMode();
							setTimeout(() => {self.readingMode = false;}, 1000);						
						}
					})
					break;
				case "okay_right":
					MM.getModules().withClass('MMM-News').enumerate(function(module) {
						if(!module.hidden && self.readingMode === false && self.check_for_validity(self.newsNextLastTime, 2, 2.5)) {
							self.sendNotification('NEWS_NEXT')
							self.sendNotification('GESTURE_INTERACTION', 'news_next')
						}
					})
					
					break;
				case "one_left":
					if(self.readingMode && self.check_for_validity(self.newsScrollUpLastTime, 0.5, 2.5)){
						self.sendNotification('NEWS_DETAIL_SCROLLUP')
					}
					break;
				case "one_right":
					if(self.readingMode && self.check_for_validity(self.newsScrollDownLastTime, 0.5, 2.5)){
						self.sendNotification('NEWS_DETAIL_SCROLLDOWN')
					} else if(!self.readingMode){
						MM.getModules().withClass('MMM-ITCH-IO').enumerate(function(module) {
							if(!module.hidden &&  self.check_for_validity(self.gamesNextLastTime, 2, 2.5)) {
								self.sendNotification('NEXT_GAME_PREVIEW')
								self.sendNotification('GESTURE_INTERACTION', 'games_next')
							}
						})
					}

					break;
			}
		});

		if((self.flatRightDetected == false)){ //&& (self.MainMenuSelectedLast != -1)
			MM.getModules().withClass("smartmirror-main-menu-center").enumerate(function(module) {
					if(!module.hidden && self.check_for_validity(self.mainMenuHideLastTime, 1, 1.5)){
						module.hide(1000, function() {Log.log(module.name + ' is hidden.');}, {lockString: "lockString"});
						self.sendNotification('GESTURE_INTERACTION', 'menu_hide') //send this notification when user desires to close the main menu via gesture

						self.MainMenuSelected = -1;
						self.MainMenuSelectedLast = -1;
						self.MainMenuSelectedTime = 0;
						self.sendNotification('MAIN_MENU', 'menu');
						self.mainManuState = self.mainManuStateObj.main;
					}
				});
			
		}

		if (self.MainMenuSelected != self.MainMenuSelectedLast){
			console.log("[" + self.name + "] menu select item  " + self.MainMenuSelected );
			self.sendNotification('MAIN_MENU_SELECT', self.MainMenuSelected);
			setTimeout(() => {self.check_for_menu_click(d.getTime(),self.MainMenuSelected);}, 2500);
			self.MainMenuSelectedTime  = d.getTime();
		}
		
		self.MainMenuSelectedLast = self.MainMenuSelected;

		if ((gestures_list.filter(function(left_two) { return left_two.name === 'two_left'; }).length > 0) &&
		   (gestures_list.filter(function(right_two) { return right_two.name === 'two_right'; }).length > 0) && 
		   (self.aiartmirrorshown == true || self.cameraimageshown == true) && self.check_for_validity(self.printLastTime, 1, 1.5)) {
			var d = new Date();
			if((d.getTime() - 15000) > self.timeOFLastPicture){ 
  				//self.sendNotification("SHOW_ALERT", {type: "notification", message: "taking a picture"});
				self.sendNotification('TAKE_SELFIE', "ART");
				self.timeOFLastPicture = d.getTime();
				if (self.aiartmirrorshown_random == true){
					self.sendNotification('smartmirror-ai-art-mirror','RANDOM_STYLE');
					self.selfieOngoing = true;
					setTimeout(() => {self.selfietaken();}, 15000);
				}
			}
		}
	},

//----------------------------------------------------------------------//
// AFTER SELLFIE
// if a selfie is taken, the controles have to be turned on again
//----------------------------------------------------------------------//
	selfietaken:function(){
		self.selfieOngoing = false;
		self.sendNotification('smartmirror-ai-art-mirror','RANDOM_STYLE');
	},

//----------------------------------------------------------------------//
// CHECK IF GESTURE TRIGGERD MENU
// a given time afer a menu point is clicked the validity needs 
// to be checked again
//----------------------------------------------------------------------//
	check_for_menu_click:function(select_time, item){
		var self = this;
		if ((item == self.MainMenuSelectedLast) && ( self.MainMenuSelected != -1) && ( select_time == this.MainMenuSelectedTime)){
			console.log("[" + self.name + "] menu click" );
			self.sendNotification('MAIN_MENU_CLICK_SELECTED');
			self.MainMenuSelected = -1;
			self.MainMenuSelectedLast = -1;
			self.sendNotification('MAIN_MENU_SELECT', self.MainMenuSelected);
		}
		console.log("[" + self.name + "] item changed.." );
	},

//----------------------------------------------------------------------//
// this function checks if a certain gesture has been performed over a period of time. timeMemory has to be property of SmartMirror-Decision-Maker class
// usage if(check_for_validity(this.newsNextLastTime, 2, 3))
//----------------------------------------------------------------------//
	check_for_validity: function(timeMemory, minTime = 2, maxTime = 3){
		const d = new Date()
		if(timeMemory.timestamp === undefined){
			timeMemory.timestamp = d
		}else {
			var diffSeconds = (d - timeMemory.timestamp) / 1000
			if(diffSeconds > minTime && diffSeconds < maxTime){
				timeMemory.timestamp = undefined
				return true
			} else if (diffSeconds > maxTime){
				timeMemory.timestamp = d
			}
		}
		return false
	},

//----------------------------------------------------------------------//
// ENABLE NEWS READING MODE
//----------------------------------------------------------------------//
	enterReadingMode: function(){
		var self = this
		Log.log("Entering reading mode")
		self.sendNotification('GESTURE_INTERACTION', 'news_reading_mode_open')
		MM.getModules().withClass(self.applicationClass).enumerate(function(module) {
			self.applicationsViewStates.push({
				name: module.name,
				visibility: !module.hidden
			})
			module.hide(1000, function() {Log.log(module.name + ' is hidden.');}, {lockString: "lockString"});
		});
		self.sendNotification('NEWS_DETAIL', {})
	},

//----------------------------------------------------------------------//
// RESTORE VIEW AFTER READING MODE
//----------------------------------------------------------------------//
	restoreView: function(){
		var self = this
		Log.log("Leaving reading mode")
		self.sendNotification('GESTURE_INTERACTION', 'news_reading_mode_close')
		MM.getModules().withClass(self.applicationClass).enumerate(function(module) {
			const item = self.applicationsViewStates.find(item => item.name == module.name)
			if(item.visibility){
				module.show(1000, function() {Log.log(module.name + ' is shown.');}, {lockString: "lockString"});
			}
		})
	},

//----------------------------------------------------------------------//
// LEAVE REAING MODE
//----------------------------------------------------------------------//
	leaveReadingMode : function(){
		self.sendNotification('NEWS_DETAIL_CLOSE', {})
		self.applicationsViewStates = []
	},

//----------------------------------------------------------------------//
// REMOVES EVERYTHING FROM CENTER DISPLAY
// is triggered by thumbs down for example
//----------------------------------------------------------------------//
	remove_everything_center_display: function(){
		self = this;
		self.sendNotification('CENTER_DISPLAY', 'HIDEALL');
		self.facerecognitionshown = false;
		self.objectdetectionshown = false;
		self.gesturerecognitionshown = false;
		self.personrecognitionshown = false;
		self.aiartmirrorshown = false;
		self.cameraimageshown = false;
		self.adjust_detection_fps();
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-facerecognition', visibility: self.facerecognitionshown});}, 500)
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Object-Detection', visibility: self.objectdetectionshown});}, 500)
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Gesture-Recognition', visibility: self.gesturerecognitionshown});}, 500)
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-camera-image', visibility: self.cameraimageshown});}, 500)
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Short-Distance', visibility: false});}, 500)
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Person-Recognition', visibility: false});}, 500)
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: self.aiartmirrorshown});}, 500)
	},

//----------------------------------------------------------------------//
// CHECK IF NOBODY IS LOOGED IN
//----------------------------------------------------------------------//
	check_for_user_idle: function(){
		self = this;
		if(self.numberOfRecognisedPersons == 0){
			if(self.currentuserid != -1){
				self.sendSocketNotification('LOGGIN_USER', -1);
			}
		}
	},

//----------------------------------------------------------------------//
// START AI ART MIRROR IF IDLE
//----------------------------------------------------------------------//
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
				setTimeout(()=>{this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: this.aiartmirrorshown});}, 500)
			}
		} 
	},
 
//----------------------------------------------------------------------//
// CREATE DOM
// shows debug information in the this.Debug_infos[key] dictionary
//----------------------------------------------------------------------//
	getDom() {

		this.data.header = 'Debug Informations'

		var myTableDiv = document.createElement("DebugTable");
		myTableDiv.className = "DebugTablexsmall";
		

  		var table = document.createElement('TABLE');
  		//table.border = '1';
		table.className = "DebugTablexsmall";

  		var tableBody = document.createElement('TBODY');
  		table.appendChild(tableBody);
		
		for (var key in this.Debug_infos) {
			var tr = document.createElement('TR');
			tr.className = "DebugTablexsmall";
			tableBody.appendChild(tr);		
			var td = document.createElement('TD');
      		td.appendChild(document.createTextNode(key));
			td.className = "DebugTablexsmall";
			//td.width = '70px';
      		tr.appendChild(td);
			var td = document.createElement('TD');
      		//td.width = '50';
      		td.appendChild(document.createTextNode(this.Debug_infos[key]));
			td.width = '30px';
      		tr.appendChild(td);   
			
			
		} 

  		myTableDiv.appendChild(table);

		return myTableDiv;
	},
	getStyles: function(){
		return ["SmartMirror-Decision-Maker.css"];
	}
});
