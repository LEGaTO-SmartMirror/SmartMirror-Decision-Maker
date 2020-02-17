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

	speechrec_aktiv: false,

	flat_right_id : -1,

	timeOfLastFlatRight : 0,
	flatRightDetected : false,
	lastTimeFlatRight: null,
	lastXOfFlatRight : 0,
	lastYOfFlatRight : 0,

	timeOfLastFlatLeft : 0,
	timeOfLastOkay : 0,
	
	lastHightOfFlatLeft : 0,
	timeOfLastOneRight : 0,

	timeOFLastGreet: 0,
	timebetweenGreets: 50000,

	timeOfLastCoffee: 0,
	timeOFLastPicture: 0,

	MainMenuItems: [],
	MainMenuItemsAmount: 0,
	MainMenuSelected: -1,
	MainMenuSelectedLast: -1,
	MainMenuItemSize: 0.0375,
	MainMenuSelectedTime: 0,

	newsNextLastTime: {timestamp: undefined},
	newsDetailLastTime: {timestamp: undefined},
	mainMenuShowLastTime: {timestamp: undefined},

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
		"MMM-Fuel"
	],

	defaults: {
	
		ai_art_mirror: true,

		maxDetFPS: 25.0,
	
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
			{name : "smartmirror-coffeebot", words : ["coffee","coffeebot"]},
			{name : "SmartMirror-Decision-Maker", words : ["Decision_maker"]}
		],
		speechrec_hotword: ["jarvis","smartmirror"]
	},

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

	notificationReceived: function(notification, payload, sender) {
		if (notification === 'DOM_OBJECTS_CREATED') {
			var self = this;
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
		}else if(notification === 'TRANSCRIPT_EN') {
			console.log("[" + this.name + "] " + "transcript received: " + payload);
			this.process_string(payload)
		}else if(notification === 'TRANSCRIPT_DE') {
			console.log("[" + this.name + "] " + "transcript received: " + payload);
			this.process_string(payload)

		}else if(notification === 'MENU_ITEMS') {
			console.log("[" + this.name + "] " + "Menu item has the following items: " + payload);
			this.MainMenuItems = payload;
			this.MainMenuItemsAmount = payload.length;
		}else if(notification === 'CENTER_DISPLAY_FPS') {
			this.Debug_infos['center display fps'] = payload;
			this.updateDom();
		}else if(notification === 'CAMERA_FPS') {
			this.Debug_infos['camera fps'] = payload;
			this.updateDom();
		}else if(notification === 'FACE_DET_FPS') {
			this.Debug_infos['face recognition fps'] = payload;
			this.updateDom();
		}else if(notification === 'OBJECT_DET_FPS') {
			this.Debug_infos['object recognition fps'] = payload;
			this.updateDom();
		}else if(notification === 'GESTURE_DET_FPS') {
			this.Debug_infos['gesture recognition fps'] = payload;
			this.updateDom();
			//console.log(this.Debug_infos);
		}else if(notification === 'AI_ART_FPS') {
			this.Debug_infos['ai art fps'] = payload;
			this.updateDom();
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
			//this.process_gestures_object(payload);
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

	process_rec_person: function(persons){
		// example:  {"1": {"TrackID": 522, "face": {"confidence": 0.9970833725349748, "w_h": [0.1037, 0.09167], "TrackID": 282, "center": [0.52222, 0.59375], "id": 4, "name": "Nils"}, "w_h": [0.375, 0.40625], "name": "person", "center": [0.4963, 0.72083]}}

		//console.log("[" + this.name + "] process_rec_person triggered " +  JSON.stringify(persons));


		if (this.numberOfRecognisedPersons != Object.keys(persons).length){
			this.numberOfRecognisedPersons = Object.keys(persons).length
			setTimeout(() => {this.check_for_user_idle();}, 3000);
			this.adjust_detection_fps();
		}

		var login_id = -1;
		if (Object.keys(persons).length != 0){
			//console.log("test "+ this.currentpersonTrackID + "        " + JSON.stringify(persons))
			if (persons.hasOwnProperty(this.currentpersonTrackID)){
				//console.log(persons[this.currentpersonTrackID])
				if (persons[this.currentpersonTrackID].hasOwnProperty('face'))
					login_id = persons[this.currentpersonTrackID].face.id
				if (persons[this.currentpersonTrackID].hasOwnProperty('gestures')) {
					this.process_gestures_object(persons[this.currentpersonTrackID].gestures);
					//console.log("[" + this.name + "] ceck gestures");
				} else {
					this.process_gestures_object([]);
				}
			}

			if (login_id < 1) {
				for(var key in persons)
					if (persons[key].hasOwnProperty('face')){
						login_id = persons[key].face.id;
						this.currentpersonTrackID = key; //persons["TrackID"];
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
			this.sendNotification('USER_LOGIN', login_id);
			if(this.readingMode){
				this.readingMode = false
				this.leaveReadingMode()
			}
			setTimeout(()=>{this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: false});}, 500)
		}
	},

	adjust_detection_fps: function(){
		if (this.objectdetectionshown) {
			this.sendNotification("smartmirror-object-detection" + "SetFPS", this.config.maxDetFPS);
		} else {
			this.sendNotification("smartmirror-object-detection" + "SetFPS", 3.0)
		}
		if (this.gesturerecognitionshown) {
			this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", this.config.maxDetFPS);
		} else {
			if (this.currentuserid == -1)
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 0.0);
			else
				this.sendNotification("smartmirror-gesture-recognition" + "SetFPS", 8.0);
		}
		if (this.facerecognitionshown) {
			this.sendNotification("smartmirror-facerecognition" + "SetFPS", this.config.maxDetFPS);
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
				this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 10.0);
			} else {
				this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 30.0);
			}
		} else {
			this.sendNotification("smartmirror-ai-art-mirror_SetFPS", 0.0);
		}

	},
	
	process_string: function(transcript){
		if (typeof transcript === 'string'){
			var self = this
			if(transcript.includes('shutdown') || transcript.includes('sudo') || transcript.includes('reboot')){
				this.sendNotification('smartmirror-TTS-en', "Thorsten no! Stop it!");
				this.sendNotification('smartmirror-TTS-ger', "Genau Thorsten! Lass es sein!");
			}else if(transcript.includes('fuck')){
				this.sendNotification('smartmirror-TTS-en', "language please!");

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
				}else if(transcript.includes('utilities')||transcript.includes('nützliches')){				
					this.sendNotification('MAIN_MENU', 'utilities');
					this.mainManuState = this.mainManuStateObj.utilities;
				}else if(transcript.includes('campus')||transcript.includes('kampus')){				
					this.sendNotification('MAIN_MENU', 'campus');
					this.mainManuState = this.mainManuStateObj.campus;
				}else if(transcript.includes('entertainment')||transcript.includes('unterhaltung')){				
					this.sendNotification('MAIN_MENU', 'entertainment');
					this.mainManuState = this.mainManuStateObj.entertainment;
				}else if(transcript.includes('smarthome')){				
					this.sendNotification('MAIN_MENU', 'smarthome');
					this.mainManuState = this.mainManuStateObj.smarthome;
				}else if(transcript.includes('preference')||transcript.includes('einstellung')){				
					this.sendNotification('MAIN_MENU', 'preferences');
					this.mainManuState = this.mainManuStateObj.preferences;
				}

			}else if(this.mainManuState === this.mainManuStateObj.camera){
				if(transcript.includes('back')||transcript.includes('zurück')){				
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}else if(transcript.includes('image')||transcript.includes('bild')){				
					this.sendNotification('CENTER_DISPLAY', 'TOGGLE');
					this.cameraimageshown = !this.cameraimageshown;
					setTimeout(() => {
						this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-camera-image', visibility: this.cameraimageshown});
						this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Short-Distance', visibility: this.shortdistanceshown});
					}, 500);
				}else if(transcript.includes('distance')||transcript.includes('distanz')){				
					this.sendNotification('CENTER_DISPLAY', 'DISTANCE');
					this.shortdistanceshown = !this.shortdistanceshown
					if(this.cameraimageshown){
						setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Short-Distance', visibility: this.shortdistanceshown});}, 500)
					}
				}else if(transcript.includes('object')){				
					this.sendNotification('CENTER_DISPLAY', 'OBJECT');
					this.objectdetectionshown = !(this.objectdetectionshown);
					this.adjust_detection_fps();
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Object-Detection', visibility: this.objectdetectionshown});}, 500)
				}else if(transcript.includes('gesture')||transcript.includes('hand')){				
					this.sendNotification('CENTER_DISPLAY', 'GESTURE');
					this.gesturerecognitionshown = !(this.gesturerecognitionshown);
					this.adjust_detection_fps();
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Gesture-Recognition', visibility: this.gesturerecognitionshown});}, 500)
				}else if(transcript.includes('face')||transcript.includes('gesicht')){				
					this.sendNotification('CENTER_DISPLAY', 'FACE');
					this.facerecognitionshown = !(this.facerecognitionshown); 
					this.adjust_detection_fps();
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-facerecognition', visibility: this.facerecognitionshown});}, 500)
				}else if(transcript.includes('person')||transcript.includes('person')){
					this.sendNotification('CENTER_DISPLAY', 'PERSON');
					this.personrecognitionshown = !(this.personrecognitionshown);
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Person-Recognition', visibility: this.personrecognitionshown});}, 500)
				}else if(transcript.includes('hide all')||transcript.includes('HIDEALL')||transcript.includes('versteck alles')||transcript.includes('remove all')){
					self.remove_everything_center_display();
						
				}else if(transcript.includes('show all')||transcript.includes('SHOWALL')){
					this.sendNotification('CENTER_DISPLAY', 'SHOWALL');
					this.facerecognitionshown = true;
					this.objectdetectionshown = true;
					this.gesturerecognitionshown = true;
					this.cameraimageshown = true;
					this.personrecognitionshown = true;
					this.adjust_detection_fps();
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-facerecognition', visibility: this.facerecognitionshown});}, 500)
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Object-Detection', visibility: this.objectdetectionshown});}, 500)
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Gesture-Recognition', visibility: this.gesturerecognitionshown});}, 500)
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-camera-image', visibility: this.cameraimageshown});}, 500)
					setTimeout(() => {this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Person-Recognition', visibility: this.personrecognitionshown});}, 500)	
				}
			}else if(this.mainManuState === this.mainManuStateObj.augmentations){
				if(transcript.includes('back')||transcript.includes('zurück')){		
					this.sendNotification('MAIN_MENU', 'menu');
					this.mainManuState = this.mainManuStateObj.main;
				}else if(transcript.includes('aiartmiror')||transcript.includes('ai')||transcript.includes('mirror')||transcript.includes('art')) {
					this.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
					this.aiartmirrorshown = ! this.aiartmirrorshown;
					this.adjust_detection_fps();
					setTimeout(()=>{this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: this.aiartmirrorshown});}, 500)
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
			}else if(this.mainManuState === this.mainManuStateObj.utilities || this.mainManuState === this.mainManuStateObj.campus || this.mainManuState === this.mainManuStateObj.entertainment){
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

	process_gestures_object: function(gestures_list){
		var self = this;

		/*if (gestures_list.length == 0){
			self.flat_right_id = -1
			return
		} */

		self.flatRightDetected = false;

		var d = new Date();

		gestures_list.forEach(function (item) {		
			if (item["name"] === "flat_right"){
				self.flatRightDetected = true;

				MM.getModules().withClass("smartmirror-main-menu-center").enumerate(function(module) {
					if (module.hidden && self.check_for_gesture_validity(self.mainMenuShowLastTime, 0.2, 0.4)){
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
			}else if (item["name"] === "thumbs_up_right"){
				
				if ((self.facerecognitionshown === false) || (self.objectdetectionshown === false) || (self.gesturerecognitionshown === false )) {
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
					setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Person-Recognition', visibility: self.personrecognitionshown});}, 500)
					
					self.adjust_detection_fps();
				}
			}else if (item["name"] === "thumbs_up_left"){
				if (self.aiartmirrorshown === false) {
					self.remove_everything_center_display();
					self.sendNotification('CENTER_DISPLAY', 'STYLE_TRANSFERE');
					self.sendNotification('GESTURE_INTERACTION', 'STYLE_TRANSFERE'); //send this notification when user desires to turn air art on
					self.aiartmirrorshown = true;
					self.adjust_detection_fps();
					self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: this.aiartmirrorshown});
				}
			}else if ((item["name"] === "thumbs_down_left") || (item["name"] === "thumbs_down_right")){
				if(self.facerecognitionshown || self.objectdetectionshown || self.gesturerecognitionshown || self.personrecognitionshown || self.aiartmirrorshown ){
					self.remove_everything_center_display();
					self.sendNotification('GESTURE_INTERACTION', 'HIDEALL'); //send this notification when user desires to hide all camera options
				}
			}else if ((item["name"] === "okay_left")){
				MM.getModules().withClass('MMM-News').enumerate(function(module) {
					if(!module.hidden && self.currentuserid != -1 && self.readingMode === false && self.check_for_gesture_validity(self.newsDetailLastTime)) {
						self.readingMode = undefined;
						self.enterReadingMode();
						setTimeout(() => {self.readingMode = true;}, 1000);
						
					} else if (module.hidden && self.readingMode === true && self.check_for_gesture_validity(self.newsDetailLastTime)) {
						self.readingMode = undefined;
						self.restoreView();
						self.leaveReadingMode();
						setTimeout(() => {self.readingMode = false;}, 1000);						
					}
				})
			}else if ((item["name"] === "okay_right")){
				MM.getModules().withClass('MMM-News').enumerate(function(module) {
					if(!module.hidden && self.readingMode === false && self.check_for_gesture_validity(self.newsNextLastTime)) {
						self.sendNotification('NEWS_NEXT')
						self.sendNotification('GESTURE_INTERACTION', 'news_next')
					}
				})
			}else if ((item["name"] === "one_left")){
				if(self.readingMode){
					self.sendNotification('NEWS_DETAIL_SCROLLUP')
				}
			}else if ((item["name"] === "one_right")){
				if(self.readingMode){
					self.sendNotification('NEWS_DETAIL_SCROLLDOWN')
				}
			}
		});

		if((self.flatRightDetected == false)){ //&& (self.MainMenuSelectedLast != -1)
			MM.getModules().withClass("smartmirror-main-menu-center").enumerate(function(module) {
					if(!module.hidden && (new Date() - self.lastTimeFlatRight) > 1200){
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
			setTimeout(() => {self.check_for_menu_click(d.getTime(),self.MainMenuSelected);}, 3000);
			self.MainMenuSelectedTime  = d.getTime();
		}
		
		self.MainMenuSelectedLast = self.MainMenuSelected;		
	},

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

	// this function checks if a certain gesture has been performed over a period of time. timeMemory has to be property of SmartMirror-Decision-Maker class
	// usage if(check_for_gesture_validity(this.newsNextLastTime, 2, 3))
	check_for_gesture_validity: function(timeMemory, minTime = 2, maxTime = 3){
		const d = new Date()
		if(timeMemory.timestamp === undefined){
			timeMemory.timestamp = d
		}else {
			var diffSeconds = (d - timeMemory.timestamp) / 1000
			if(diffSeconds > minTime && diffSeconds < maxTime){
				timeMemory.timestamp = undefined
				return true
			} else if (diffSeconds > 3){
				timeMemory.timestamp = d
			}
		}
		return false
	},

	disable_speechrec: function(){
		this.sendNotification('SPEECHREC_AKTIV',false);
		this.speechrec_aktiv = false;	
	},

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

	leaveReadingMode : function(){
		self.sendNotification('NEWS_DETAIL_CLOSE', {})
		self.applicationsViewStates = []
	},

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
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'SmartMirror-Person-Recognition', visibility: self.personrecognitionshown});}, 500)
		setTimeout(() => {self.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: self.aiartmirrorshown});}, 500)
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
				setTimeout(()=>{this.sendNotification('MODULE_VISIBILITY_STATUS', {moduleName: 'smartmirror-ai-art-mirror', visibility: this.aiartmirrorshown});}, 500)
			}
		} 
	},
 
	getDom() {

		var myTableDiv = document.createElement("DebugTable");
		

  		var table = document.createElement('TABLE');
  		//table.border = '1';
		table.className = "xsmall";

  		var tableBody = document.createElement('TBODY');
  		table.appendChild(tableBody);
		
		for (var key in this.Debug_infos) {
			var tr = document.createElement('TR');
			tableBody.appendChild(tr);

			var td = document.createElement('TD');
      		td.appendChild(document.createTextNode(key));
      		tr.appendChild(td);
			var td = document.createElement('TD');
      		td.width = '50';
      		td.appendChild(document.createTextNode(this.Debug_infos[key]));
      		tr.appendChild(td);   
		} 

  		myTableDiv.appendChild(table);

		return myTableDiv;
	}
});
