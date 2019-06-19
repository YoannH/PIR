var express = require("express");
var app = express();
var fs = require('fs');


var server = require('http').Server(app);
var io = require('socket.io')(server);



//VARIABLES
var date;
var wstream;
var gameTime = 600;
var waitingTime = 15;
var remainingTime = 0;
var nbPlayers = 0;
var nbReadyPlayers = 0;
var player1 ;
var socketsArray = [];
var socketNb1;
var socketNb2;
var player1Ready = false;
var player2Ready = false;
var globalToken = 0;
var gameAvailable = true;
var gameWillSoonStart = false;


var nbPlayersLogged = 0;
server.listen(3000, () => {
	console.log("Server listening on port 3000");
});

// var cleanSocketArrayInterval = setInterval(() => {
// 	socketsArray.forEach((element) => {
// 		if(!element.socket.connected){
// 			socketsArray.splice(element.token,1);
// 		}
// 	});
// }, 600000);

io.on('connection', (socket) => {
	globalToken += 1;
	socket.emit("tokenResponse", {token : globalToken});
	socketsArray[globalToken] = {socket : socket , token : globalToken} ;
	socket.on("getRemainingTime", () => {
		socket.emit("remainingTimeResponse", {remainingTime : remainingTime });
	});

	socket.on("getScores", (data) => {
		var scoreChain = fs.readFileSync('scores.json', 'UTF-8');
		var scores = JSON.parse(scoreChain);
		socket.emit("scores", { scores : scores});
	});

	//traitement lors d'une requete pour jouer (redirection vers la page de chargement 
	// et lancement ou non d'un timer)
	socket.on("getPlay", (data) => {
		var token = data.token;
		if(gameAvailable){
			socket.emit("accessAuthorized", {});
			
			nbPlayers++;
			if(nbPlayers === 1){
				player1 = data.token;
				socketNb1 = socket;
			}else{
				//les 2 joueurs sont connectés dans l'écran de chargement
				if(socketNb1.connected){
					//on renseigne les autres connectés que le serveur est occupé
					remainingTime = gameTime + waitingTime;
					socketsArray.forEach((element) => {
						element.socket.emit("remainingTimeResponse", {remainingTime : remainingTime});

					});

					player2 = data.token;
					socketNb2 = socket;
					gameAvailable = false;
					gameWillSoonStart = true;
					player1Ready = false;
					player2Ready = false;
					waitingTime = 15;
					
					nbReadyPlayers = 0;
					pseudo1 = '';
					pseudo2 = '';
					//on lance un timer de 15 secondes : les joueurs doivent cliquer sur un bouton
					//avant la fin pour lancer la partie, ceux qui ne le font pas sont redirigés 
					//en dehors de l'écran de chargement
					//si les 2 le font la partie se lance
					const waitingRepeater = setInterval( () => {
						if(waitingTime > 0){
							waitingTime--;
							socketNb1.emit("timeBeforeStart", {timeBeforeStart : waitingTime});
							socketNb2.emit("timeBeforeStart", {timeBeforeStart : waitingTime});
						}
						else{
							if(nbReadyPlayers === 2){
								socketNb1.emit("launchingGame", {});
								socketNb2.emit("launchingGame", {});
								nbPlayersLogged = 0;
								initGame();
							}
							else{
								if(player1Ready){
									socketNb1.emit("launchFailed", {waitingAgain : true});
									socketNb2.emit("launchFailed", {waitingAgain : false});
									nbPlayers = 1;
								}
								else{
									if(player2Ready){
										socketNb1.emit("launchFailed", {waitingAgain : false});
										socketNb2.emit("launchFailed", {waitingAgain : true});
										nbPlayers = 1;
										player1 = player2;
										socketNb1 = socketNb2;
									}
									else{
										socketNb1.emit("launchFailed", {waitingAgain : false});
										socketNb2.emit("launchFailed", {waitingAgain : false});
										nbPlayers = 0;
									}
								}
								gameAvailable = true;
								gameWillSoonStart = false;
								remainingTime = 0;

								socketsArray.forEach((element) => {
									element.socket.emit("remainingTimeResponse", {remainingTime : remainingTime});	
								});

							}
							clearInterval(waitingRepeater);
						}
					}, 1000);
				}
				//le premier joueur s'est déconnecté entre temps
				else{
					nbPlayers--;
					player1 = token;
				}
			}
		}else{
			socket.emit("accessDenied", {remainingTime : remainingTime});
		}		
	});

	socket.on("readyToPlay", (data) =>{
		nbPlayersLogged +=1;
		if(nbPlayersLogged === 2){
			startGame();
		}
	});

	socket.on("ready", (data) => {
		token = data.token;
		var playerNumber = 0
		if(token === player1){
			playerNumber = 1;
			if(data.pseudo){
				pseudo1 = data.pseudo;
			}else{
				pseudo1 = "anonym";
			}
		}else if(token === player2){
			playerNumber = 2;
			if(data.pseudo){
				pseudo2 = data.pseudo;
			}else{
				pseudo2 = "anonym";
			}
		}
		if(gameWillSoonStart && (playerNumber != 0)){
			if(playerNumber === 1 && !player1Ready){
				player1Ready = true;
				nbReadyPlayers +=1;
			}
			else if(!player2Ready){
				player2Ready = true;
				nbReadyPlayers +=1;
			}
		}else{
			socket.emit("launchFailed", {waitingAgain : false});
		}
	});

	socket.on("killAll", (data) => {
		finishGame(2);
	});

	//key controls
	socket.on('clickLeak', (data) => {
		var playerDatas = player1Datas;
		if(data.token === player2){
			playerDatas = player2Datas;
		}
		var comma = (playerDatas.stringWriteClicks == "'") ? '' : ',';
		playerDatas.stringWriteClicks += comma + 'clickLeak' + data.key.toString();
		clickLeak(data.key);
	});

	socket.on('removeAlarm', (data) => {
		var playerDatas = player1Datas;
		if(data.token === player2){
			playerDatas = player2Datas;
		}
		var comma = (playerDatas.stringWriteClicks == "'") ? '' : ',';
		playerDatas.stringWriteClicks += comma + 'removeAlarm';
		clickLeak(data.key);
	});

	socket.on('key', (data) => {
		var playerData;
		if(data.token === player1){
			playerData = player1Datas;
		}else{
			playerData = player2Datas;
		}
		var key = data.key;
		var comma = (playerData.stringWriteUsedKeys == "'") ? '' : ',';
		playerData.stringWriteUsedKeys += comma + data.key;

		if(key == 'upDown'){
			playerData.direction = 1;
		}
		else if(key == 'upUp'){
			playerData.direction = 0;
		}
		else if(key =='downDown'){
			playerData.direction = -1;
		}
		else if(key =='downUp'){
			playerData.direction = 0;
		}
		else if(key =='rightDown'){
			playerData.rotDirection = 1;
		}
		else if(key =='rightUp'){
			playerData.rotDirection = 0;
		}
		else if(key =='leftDown'){
			playerData.rotDirection = -1;
		}
		else if(key =='leftUp'){
			playerData.rotDirection = 0;
		}
		else if(key == 'a'){
			wrenchOnOff();
		}
		else if(key == 'e'){
			waterPushButton();
		}
		else if(key == 's'){
			faucetCtrlFctMinus();
		}
		else if(key == 'd'){
			faucetCtrlFctPlus();
		}
		else if(key == 'space'){
			var player = player1Datas;
			if(data.token == player2){
				player = player2Datas;
			}
			throwWater(player, socket);
		}
		else if(key == '1'){
			sendMessage(1,data.token);
		}
		else if(key == '2'){
			sendMessage(2,data.token);
		}
		else if(key == '3'){
			sendMessage(3,data.token);
		}
		else if(key == '4'){
			sendMessage(4,data.token);
		}
		else if(key == '5'){
			sendMessage(5,data.token);
		}
		else if(key == '6'){
			sendMessage(6,data.token);
		}
		else if(key == 'rDown'){
			trySendWater(data.token);
		}
		else if(key == 'tDown'){
			tryReceiveWater(data.token);
		}
		else if(key == 'fDown'){
			trySendBattery(data.token);
		}
		else if(key == 'gDown'){
			tryReceiveBattery(data.token);
		}
		else if(key == 'rUp'){
			playerData.givingWater = false;
		}
		else if(key == 'tUp'){
			playerData.receivingWater = false;
		}
		else if(key == 'fUp'){
			playerData.givingBattery = false;
		}
		else if(key == 'gUp'){
			playerData.receivingWater = false;
		}
		

	});

});

//GAME DATA
var pseudo1 ;
var pseudo2;

var player1Datas ;
var player2Datas ;

var player1DatasToSend ;
var player2DatasToSend ;

var water ;

var treesLocations;
var zonesLocations;


var timeStep = 0.02;
var leakPlacesNb = 9;
var collidingThreshold = 3;
var extinguishThreshold = 10;
var angleThreshold = 0.9;
var baseIncrement = -2;
var baseHeat = 20;
var heatFactor = 1.5;
var heatThreshold = 10;
var inRange = false;
var inRangeThreshold = 10;
var probaAutonomous = 0.5;
var probaStopAutonomous = 0.6;
var autonomousExtinguishThreshold = 8;
var autonomousCollidingThreshold = 5;
var autonomousCapThreshold = 0.1;
var autonomousScalarProdThreshold = 0.7;

//Intervals
var socketStates;
var waterRepeater;
var timer;
var sendData;
var calculateData;
var waterManagementInterval;
var waterFlowInterval;
var leaksInterval;
var batteryInterval;
var treeBurningInterval;
var temperatureInterval;
var exchangeWaterInterval;
var exchangeBatteryInterval;

var isFinished;

var teamScore;
var newBestScore;








function initGame(){
	socketStates = setInterval( () => {
		if(!socketNb1.connected || !socketNb2.connected){
			finishGame(2);
		}
	}, 1000);
	teamScore = 0;
	newBestScore = false;
	player1Datas = {};
	player2Datas = {};
	player1DatasToSend = {};
	player2DatasToSend = {};
	player1Datas.socket = socketNb1;
	player2Datas.socket = socketNb2;
	water = {};

	var p = Math.random();
	if(p > 0.5){
		player1Role = 'tanker';
		socketNb1.emit('role', 'tanker');
		initTanker(player1Datas);
		player2Role = 'speeder';
		socketNb2.emit('role', 'speeder');
		initSpeeder(player2Datas);
	}else{
		player1Role = 'speeder';
		socketNb1.emit('role', 'speeder');
		initSpeeder(player1Datas);
		player2Role ='tanker';
		socketNb2.emit('role', 'tanker');
		initTanker(player2Datas);
	}

	date = new Date();
	wstream = fs.createWriteStream('records/record_' + date.getFullYear() + '_' + ('0' + (date.getMonth()+1)).slice(-2) + '_' + ('0' + date.getDate()).slice(-2) + '__' + ('0' + date.getHours()).slice(-2) + '_' + ('0' + date.getMinutes()).slice(-2) + '.txt');
	wstream.write('#robot1 : ' + player1Role + ', robot2 : ' + player2Role + '\n');
	wstream.write('# remaining_time, trees_state, global_score, ground_tank_water_level, leaks, personnal_score1, autonomous1, alarms1, robot1_x, robot1_y, robot1_theta, robot1_battery, robot1_temperature, robot1_waterlevel, robot1_shortkeys, robot1_clicks, personnal_score2, autonomous2, alarms2, robot2_x, robot2_y, robot2_theta, robot2_battery, robot2_temperature, robot2_waterlevel, robot2_shortkeys, robot2_clicks  \n');

	isFinished = false;
	remainingTime = 600;
	
	player1DatasToSend.pos = player1Datas.pos;
	player1DatasToSend.other = player2Datas.pos;
	player1DatasToSend.water = water;	
	player1Datas.battery = player1Datas.maxBatteryLevel;
	player1Datas.noBattery = false;
	player1Datas.autonomousMode = false;
	player1Datas.previouslyAutonomous = false;
	

	player2DatasToSend.pos = player2Datas.pos;
	player2DatasToSend.other = player1Datas.pos;
	player2DatasToSend.water = water;
	player2DatasToSend.remainingTime = remainingTime;
	player2Datas.battery = player2Datas.maxBatteryLevel;
	player2Datas.noBattery = false;
	player2Datas.autonomousMode = false;
	player2Datas.previouslyAutonomous = false;


	player1Datas.stringWriteAlarms = "'";
	player2Datas.stringWriteAlarms = "'";
	player1Datas.stringWriteClicks = "'";
	player2Datas.stringWriteClicks = "'";
	player1Datas.stringWriteUsedKeys = "'";
	player2Datas.stringWriteUsedKeys = "'";
	
	

	initWater();

	var chaine = fs.readFileSync('trees.json', 'UTF-8');
	treesLocations = JSON.parse(chaine);

	chaine = fs.readFileSync('zones.json' , 'UTF-8');
	zonesLocations = JSON.parse(chaine);

	firesStatesOfTrees = [];
	for(var i = 0; i < treesLocations.length; i++){
		firesStatesOfTrees.push(0);
	}
	player1DatasToSend.fires = firesStatesOfTrees;
	player2DatasToSend.fires = firesStatesOfTrees;
	player1Datas.temperature = 0;
	player2Datas.temperature = 0;
}

function startGame(){

	socketNb1.emit("trees", {trees : treesLocations});
	socketNb1.emit("zones", {zones : zonesLocations});
	socketNb1.emit("role", { role : player1Datas.role});
	socketNb2.emit("trees", {trees : treesLocations});
	socketNb2.emit("zones", {zones : zonesLocations});
	socketNb2.emit("role", { role : player2Datas.role});

	writeDatasInterval = setInterval(() => {
		player1Datas.stringWriteAlarms += "'";
		player2Datas.stringWriteAlarms += "'";
		player1Datas.stringWriteClicks += "'";
		player2Datas.stringWriteClicks += "'";
		player1Datas.stringWriteUsedKeys += "'";
		player2Datas.stringWriteUsedKeys += "'";
		wstream.write(remainingTime + ', ' + firesString() + ', ' + teamScore + ', ' + water.waterLevelContainer+ ', ' + leakPlacesString() + ', ' + player1Datas.personnalScore + ', ' + player1Datas.autonomousMode + ', ' + player1Datas.stringWriteAlarms + ', ' + player1Datas.pos[0] + ', ' + player1Datas.pos[1] + ', ' + player1Datas.pos[2] + ', ' + player1Datas.battery + ', ' + player1Datas.temperature + ', ' + player1Datas.waterLevel + ', ' + player1Datas.stringWriteUsedKeys + ', ' + player1Datas.stringWriteClicks + ', ' + player2Datas.personnalScore + ', ' + player2Datas.autonomousMode + ', ' + player2Datas.stringWriteAlarms + ', ' + player2Datas.pos[0] + ', ' + player2Datas.pos[1] + ', ' + player2Datas.pos[2] + ', ' + player2Datas.battery + ', ' + player2Datas.temperature + ', ' + player2Datas.waterLevel + ', ' + player2Datas.stringWriteUsedKeys + ', ' + player2Datas.stringWriteClicks + '\n');
		player1Datas.stringWriteAlarms = "'";
		player2Datas.stringWriteAlarms = "'";
		player1Datas.stringWriteClicks = "'";
		player2Datas.stringWriteClicks = "'";
		player1Datas.stringWriteUsedKeys = "'";
		player2Datas.stringWriteUsedKeys = "'";
	}, 1000);

	calculateData = setInterval(() => {
		if(!isFinished){
			dataProcessing();
		}else{
			clearInterval(calculateData);
		}
	}, 20);

	waterManagementInterval = setInterval(() => {
		if((water.xRobinet <= 80) && (water.xRobinet >= 0)) {
			water.xRobinet = water.xRobinet + water.coeffSpeed * (Math.PI / 80) * Math.sin(Math.PI * water.xRobinet / 40 - Math.PI) + water.faucetControl;
		  } else if(water.xRobinet > 80) {
			water.xRobinet = 80;
		  } else if(water.xRobinet < 0) {
			  water.xRobinet = 0;
		  }
		  //water.xRobinet += water.decal;
		  water.faucetXAxis = (water.xRobinet - 40) * 10 / 40;
		  water.yRobinet = water.coeffXRob * Math.cos(water.faucetXAxis* Math.PI *2 / 20) + water.constXRob;
	
	}, 200);

	waterFlowInterval = setInterval(() => {
		var leaksSum = 0;
		for(var i = 0; i < leakPlacesNb; i++) {
		  if(!water.noLeakAt[i]){
			leaksSum = leaksSum + 1;
		  }
		}
		if(water.waterLevelContainer <= 100){
		  water.waterLevelContainer -= leaksSum/(2*leakPlacesNb);
		  if((water.faucetXAxis < 2) && (water.faucetXAxis > -2)){
			water.waterLevelContainer += water.waterWidth*10/7;
		  }
		}
		else{
		  water.waterLevelContainer -= leaksSum/leakPlacesNb;
		}
		if(water.waterLevelContainer < 0){
			water.waterLevelContainer = 0;
		}
	}, 200);

	leaksInterval = setInterval(() => {
		if(Math.random() < 0.5) {
			var myInt = Math.floor(Math.random()* leakPlacesNb);
			water.noLeakAt[myInt] = false;
		  }
		  for (var i=0 ; i < water.leakPlaces.length ; i++){
			if (!water.noLeakAt[i] && water.previousNoLeakAt[i]){
			  if (Math.random()>0.5){
				water.leaksReverse[i] = -1;
			  } else{
				water.leaksReverse[i] = 1;
			  }
			  water.leftValues[i] = Math.random()*30;
			  water.previousNoLeakAt[i] = water.noLeakAt[i];
			}
		  }
	}, 5000);

	temperatureInterval = setInterval( () => {
		var heatIncrement1 = baseIncrement;
		var heatIncrement2 = baseIncrement;
		var player1Pos = { x : player1Datas.pos[0], y : player1Datas.pos[1]};
		var player2Pos = { x : player2Datas.pos[0], y : player2Datas.pos[1]};
		for(var i = 0; i < treesLocations.length; i++){
			if(firesStatesOfTrees[i]){
				var distance1 = distance(treesLocations[i], player1Pos);
				if(distance1 < heatThreshold){
					heatIncrement1 += baseHeat - heatFactor * distance1;
				}
				var distance2 = distance(treesLocations[i], player2Pos);
				if(distance2 < heatThreshold){
					heatIncrement2 += baseHeat - heatFactor * distance2;
				}
			}
		}
		player1Datas.temperature += heatIncrement1;
		player2Datas.temperature += heatIncrement2;
		if(player1Datas.temperature < 0){
			player1Datas.temperature = 0;
		}
		if(player2Datas.temperature < 0){
			player2Datas.temperature = 0;
		}
		if(player1Datas.temperature >= 70 && !player1Datas.temperatureAlarmSent){
			player1Datas.temperatureAlarmSent = true;
			var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
			player1Datas.stringWriteAlarms += comma + '4';
			socketNb1.emit("alarm", {id : 4});
		}
		if(player2Datas.temperature >= 70 && !player2Datas.temperatureAlarmSent){
			player2Datas.temperatureAlarmSent = true;
			var comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
			player2Datas.stringWriteAlarms += comma + '4';
			socketNb2.emit("alarm", {id : 4});
		}
		if(player1Datas.temperature < 70 && player1Datas.temperatureAlarmSent){
			player1Datas.temperatureAlarmSent = false;
		}
		if(player2Datas.temperature < 70 && player2Datas.temperatureAlarmSent){
			player2Datas.temperatureAlarmSent = true;
		}
		if(player1Datas.temperature >= 100 || player2Datas.temperature >= 100){
			finishGame(4);
		}
		
	}, 1000);

	batteryInterval = setInterval(() => {
		if(player1Datas.battery > 0){
			player2Datas.otherBatteryAlarmSent = false;
			player1Datas.battery--;
			if(player1Datas.noBattery){
				player1Datas.noBattery = false;
			}
			if(!player1Datas.ownBatteryAlarmSent && player1Datas.battery <= 20){
				var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
				player1Datas.stringWriteAlarms += comma + '2';
				player1Datas.ownBatteryAlarmSent = true;
				socketNb1.emit("alarm", {id : 2});
			}
		}else{
			player1Datas.noBattery = true;
			if(!player2Datas.otherBatteryAlarmSent){
				var comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
				player2Datas.stringWriteAlarms += comma + '3';
				player2Datas.otherBatteryAlarmSent = true;
				socketNb2.emit("alarm", {id : 3});
			}
		}
		if(player2Datas.battery > 0){
			player1Datas.otherBatteryAlarmSent = false;
			if(player2Datas.noBattery){
				player2Datas.noBattery = false;
			}
			player2Datas.battery--;
			if(!player2Datas.ownBatteryAlarmSent && player2Datas.battery <= 20){
				var comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
				player2Datas.stringWriteAlarms += comma + '2';
				player2Datas.ownBatteryAlarmSent = true;
				socketNb2.emit("alarm", {id : 2});
			}
		}else{
			player2Datas.noBattery = true;
			if(!player1Datas.otherBatteryAlarmSent){
				var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
				player1Datas.stringWriteAlarms += comma + '3';
				player1Datas.otherBatteryAlarmSent = true;
				socketNb1.emit("alarm", {id : 3});
			}
		}
		if(player1Datas.noBattery && player2Datas.noBattery){
			finishGame(3);
		}
	},1000);

	var alea1 = -1;
	var alea2 = -1;
	var treeNumber = -1;
	var onFire = false;
	
	treeBurningInterval = setInterval(() => {
		alea1 = Math.random();
		alea2 = Math.random();
		treeNumber = Math.floor(alea1 * treesLocations.length);
		onFire = false;
		if(alea2 < 0.33333) {
			onFire = true;
		}
		if(onFire && (treeNumber != -1) && !firesStatesOfTrees[treeNumber]) {
			firesStatesOfTrees[treeNumber] = 1;
			
		}
	}, 3000);

	timer = setInterval(() => {
		if(!isFinished && remainingTime > 0){
			remainingTime--;
			if(remainingTime == 30){
				var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
				player1Datas.stringWriteAlarms += comma + '5';
				comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
				player2Datas.stringWriteAlarms += comma + '5';
				socketNb1.emit("alarm", {id : 5});
				socketNb2.emit("alarm", {id : 5});
			}
		}else{
			isFinished = true;
			finishGame(1);
		}
	}, 1000);

	player1Datas.autonomousInterval = setInterval(() => {autonomousFunction(player1Datas);}, 10000);
	player2Datas.autonomousInterval = setInterval(() => {autonomousFunction(player2Datas);}, 10000);

	sendData = setInterval(() => {
		if(!isFinished){
			
			player1Datas.batteryLevel = player1Datas.battery/player1Datas.maxBatteryLevel *100;
			player1DatasToSend.waterLevel = player1Datas.waterLevel/player1Datas.maxWaterLevel * 100;		
			player1DatasToSend.batteryLevel = player1Datas.batteryLevel;
			player1DatasToSend.noBattery = player1Datas.noBattery;
			player1DatasToSend.remainingTime = remainingTime;
			player1DatasToSend.inRange = inRange;
			player1DatasToSend.teamScore = teamScore;
			player1DatasToSend.personnalScore = player1Datas.personnalScore;
			player1DatasToSend.temperature = player1Datas.temperature;
			player1DatasToSend.autonomousMode = player1Datas.autonomousMode;

			player2Datas.batteryLevel = player2Datas.battery/player2Datas.maxBatteryLevel *100;
			player2DatasToSend.batteryLevel = player2Datas.batteryLevel;
			player2DatasToSend.waterLevel = player2Datas.waterLevel/player2Datas.maxWaterLevel * 100;
			player2DatasToSend.remainingTime = remainingTime;		
			player2DatasToSend.noBattery = player2Datas.noBattery;
			player2DatasToSend.inRange = inRange;
			player2DatasToSend.teamScore = teamScore;
			player2DatasToSend.personnalScore = player2Datas.personnalScore;
			player2DatasToSend.temperature = player2Datas.temperature;
			player2DatasToSend.autonomousMode = player2Datas.autonomousMode;

			socketNb1.emit("gameData", player1DatasToSend);
			socketNb2.emit("gameData", player2DatasToSend);
		}else{
			clearInterval(sendData);
		}
	}, 50);

	
	
}



function initWater(){
	
	water.leakPlaces  = [];
	water.noLeakAt  = [];
	water.previousNoLeakAt  = [];
	water.leaksReverse  = [];
	water.leftValues = [];
	water.leakCounter  = 0;

	water.faucetControl  = 0;
	water.faucetControlShow = '0';
	water.direction = 0;
	water.animTime  = 0;
 	
	water.waterWidth = 0;
	water.callCount  = 0;
	
	water.wrenchMode = false;

	water.xRobinet  = 42;
	water.coeffSpeed  = 20;
	water.faucetXAxis = 2 * 10 / 40;
	water.yRobinet = 0 ;
	water.coeffXRob = 10;
	water.constXRob  = 50;
	water.waterLevelContainer = 50;

	for (var i=0; i < leakPlacesNb; i++) {
		water.leakPlaces.push(water.leakCounter);
		water.leakCounter++;
		water.noLeakAt.push(true);
		water.previousNoLeakAt.push(true);
		water.leftValues.push(0);
		water.leaksReverse.push(0);
	  }
}


function initSpeeder(player){
	player.pos = [75, 60, Math.PI];
	player.maxWaterLevel = 50;
	player.waterLevel = 30;
	player.maxBatteryLevel = 50;
	player.transSpeed = 20;
	player.rotSpeed = 1; 
	player.rotDirection = 0;
	player.direction = 0;
	player.role = 'speeder';
	player.personnalScore = 0;
}

function initTanker(player){
	player.pos = [75, 40, Math.PI];
	player.maxWaterLevel = 100;
	player.waterLevel = 50;
	player.maxBatteryLevel = 100;
	player.transSpeed = 15;
	player.rotSpeed = 0.7; 
	player.rotDirection = 0;
	player.direction = 0;
	player.role = 'tanker';
	player.personnalScore = 0;
}

function dataProcessing(){
	processPosition(player1Datas);
	processPosition(player2Datas);
	var player1Pos = { x : player1Datas.pos[0], y : player1Datas.pos[1] };
	var player2Pos = { x : player2Datas.pos[0], y : player2Datas.pos[1] };
	var inRange2 = distance(player1Pos, player2Pos) < inRangeThreshold;
	if(inRange && !inRange2){
		player1Datas.givingWater = false;
		player1Datas.receivingWater = false;
		player1Datas.givingBattery = false;
		player1Datas.receivingBattery = false;
		player2Datas.givingWater = false;
		player2Datas.receivingWater = false;
		player2Datas.givingBattery = false;
		player2Datas.receivingBattery = false;
	}
	inRange = inRange2
}

function processPosition(player){
	if(!player.noBattery){
		var nextPos = {};
		nextPos.x = player.pos[0];
		nextPos.y = player.pos[1];
		if(player.direction === 1){
			nextPos.x += player.transSpeed * timeStep * Math.cos(player.pos[2]);
			nextPos.y += player.transSpeed * timeStep * Math.sin(player.pos[2]);
		}else if(player.direction === -1){
			nextPos.x -= 0.5* player.transSpeed * timeStep * Math.cos(player.pos[2]);
			nextPos.y -= 0.5 * player.transSpeed * timeStep * Math.sin(player.pos[2]);
		}
		var colliding = false;
		treesLocations.forEach( (tree) => {
			if(distance(tree, nextPos) < collidingThreshold){
				colliding = true;
			}
		});
		if(!colliding){
			player.pos[0] = nextPos.x;
			player.pos[1] = nextPos.y;
		}
		player.pos[2] += player.rotDirection * timeStep * player.rotSpeed; 
		player.pos[2] = ((player.pos[2] % (2 * Math.PI)) + 2 * Math.PI) %(2*Math.PI);
	}
	for(var i = 0; i<2; i++){
		if(player.pos[i] < 0){
			player.pos[i] = 0;
		}
		if(player.pos[i] > 100){
			player.pos[i] = 100;
		}
	}
	

	if(!player.isRefillingBattery && player.pos[0] >= zonesLocations.batteryZone.x && player.pos[0] <= zonesLocations.batteryZone.x + 10 && player.pos[1] >= zonesLocations.batteryZone.y && player.pos[1] <= zonesLocations.batteryZone.y + 10){
			player.isRefillingBattery = true;
			player.refillingBatteryInterval = setInterval(() => {
				if(player.isRefillingBattery && player.pos[0] >= zonesLocations.batteryZone.x && player.pos[0] <= zonesLocations.batteryZone.x + 10 && player.pos[1] >= zonesLocations.batteryZone.y && player.pos[1] <= zonesLocations.batteryZone.y + 10){
					if(player.battery/player.maxBatteryLevel*100 < 99 ){
						player.battery += 1 * player.maxBatteryLevel/100;
					}else{
						player.battery = player.maxBatteryLevel;
					}
					if(player.battery > 20){
						player.ownBatteryAlarmSent = false;
					}
				}else{
					player.isRefillingBattery = false;
					clearInterval(player.refillingBatteryInterval);
				}
			}, 50);
	}
	if(!player.isRefillingWater && player.pos[0] >= zonesLocations.waterZone.x && player.pos[0] <= zonesLocations.waterZone.x + 10 && player.pos[1] >= zonesLocations.waterZone.y && player.pos[1] <= zonesLocations.waterZone.y + 10){
		player.isRefillingWater = true;
		player.refillingWaterInterval = setInterval(() => {
			if(player.isRefillingWater && player.pos[0] >= zonesLocations.waterZone.x && player.pos[0] <= zonesLocations.waterZone.x + 10 && player.pos[1] >= zonesLocations.waterZone.y && player.pos[1] <= zonesLocations.waterZone.y + 10){
				if(player.waterLevel  < player.maxWaterLevel && water.waterLevelContainer >= 10 ){
					player.waterLevel += 10;
					water.waterLevelContainer -= 10
					if(player.waterLevel > player.maxWaterLevel){
						player.waterLevel = player.maxWaterLevel;
					}
					if(player.waterLevel >= 21){
						player.waterAlarmSent = false;
					}
					
				}
			}else{
				player.isRefillingWater = false;
				clearInterval(player.refillingWaterInterval);
			}
		}, 1000);
}

}

function faucetCtrlFctMinus(){
    if(water.faucetControl > -3) {
      water.faucetControl--; 
      water.faucetControlShow = water.faucetControl.toString();
    }
    if(water.faucetControl > 0){
        water.faucetControlShow = '+' + water.faucetControl.toString();
        water.direction = 1;
      }
    else if(water.faucetControl < 0){
      water.direction = -1;
    }
    else{
      water.direction = 0;
    }
    water.animTime = 10 - Math.abs(water.faucetControl)*3;
}

function faucetCtrlFctPlus(){
    if(water.faucetControl < 3) {
      water.faucetControl++; 
      water.faucetControlShow = water.faucetControl.toString();
    }
    if(water.faucetControl > 0){
        water.faucetControlShow = '+' + water.faucetControl.toString();
        water.direction = 1;
      }
    else if(water.faucetControl < 0){
      water.direction = -1;
    }
    else{
      water.direction = 0;
    }
    water.animTime = 7 - Math.abs(water.faucetControl)*2;
}

function waterPushButton(){
    water.waterWidth = 7/10;
    water.callCount = 1;
    clearInterval(waterRepeater);
    waterRepeater = setInterval(() => {
      if (water.callCount < 8) {
        water.waterWidth = (7 - water.callCount)/10;
        water.callCount++;
      } else {
        clearInterval(water.repeater);
      }
    }, 1000);
}

function throwWater(player, socket){
	var waterThrowed = false;
	if(player.waterLevel >= 10){
		player.waterLevel -= 10;
		socket.emit("waterThrowed", {});
		waterThrowed = true;
		if(player.waterLevel <= 20 && !player.waterAlarmSent){
			var comma = (player.stringWriteAlarms == "'") ? '' : ',';
			player.stringWriteAlarms += comma + '1';
			socket.emit("alarm", {id : 1})
			player.waterAlarmSent = true;
		}
	}
	if(waterThrowed){
		var treeExtinguished = false;
		for(var i = 0; i <treesLocations.length; i++){
			if(!treeExtinguished && firesStatesOfTrees[i]){
				var playerPos = {x : player.pos[0], y : player.pos[1] };
				var distanceToTree = distance(treesLocations[i], playerPos);
				if( distanceToTree < extinguishThreshold){

					var diffX = (treesLocations[i].x - playerPos.x)/distanceToTree;
					var diffY = (treesLocations[i].y - playerPos.y)/distanceToTree;
					var roboToX = Math.cos(player.pos[2]);
					var roboToY = Math.sin(player.pos[2]);
					var scalprod = roboToX * diffX + roboToY * diffY;
					if(scalprod > angleThreshold){
						firesStatesOfTrees[i] = 0;
						treeExtinguished = true;
						player.personnalScore += 1;
						teamScore += 1;
					}
				}
			}
		}
	}

}

function clickLeak(leakId) {
    if(water.wrenchMode) {
      water.noLeakAt[leakId] = true;
      water.wrenchMode = false;
	}
}

function wrenchOnOff(){
    water.wrenchMode = !water.wrenchMode;
}

function distance(point1, point2){
	return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

function sendMessage(id, token){
	if(token == player1){
		socketNb1.emit("message", {id : id, status : 'textSent'});
		socketNb2.emit("message", {id : id, status : 'textReceived'});
	}
	else{
		socketNb1.emit("message", {id : id, status : 'textReceived'});
		socketNb2.emit("message", {id : id, status : 'textSent'});
	}
}

function trySendWater(token){
	var giver = (token == player1) ? player1Datas : player2Datas;
	var receiver = (token == player1) ? player2Datas : player1Datas;
	var receiverSocket = (token == player1) ? socketNb2 : socketNb1;
	if(inRange && giver.waterLevel > 0  && !giver.receivingWater ){
		giver.givingWater = true;
		if(receiver.receivingWater){
			exchangeWaterInterval = setInterval( () => {
				if(inRange && giver.waterLevel > 0 && giver.givingWater && receiver.receivingWater && receiver.waterLevel < receiver.maxWaterLevel){
					giver.waterLevel -= 1;
					receiver.waterLevel += 1;
					if(receiver.waterAlarmSent && receiver.waterLevel > 20 ){
						receiver.waterAlarmSent = false;
					}
					if(!giver.waterAlarmSent && giver.waterLevel <= 20 ){
						giver.waterAlarmSent = true;
						if(token == player1){
							var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
							player1Datas.stringWriteAlarms += comma + '1';
							socketNb1.emit("alarm", {id : 1});
						}
						else{
							var comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
							player2Datas.stringWriteAlarms += comma + '1';
							socketNb2.emit("alarm", {id : 1});
						}
					}
				}
				else{
					clearInterval(exchangeWaterInterval);
				}
			}, 100);
		}else{
			receiverSocket.emit("message", {id : 7, status : 'textAlert'});
		}
	}
}

function tryReceiveWater(token){
	var giver = (token == player2) ? player1Datas : player2Datas;
	var receiver = (token == player2) ? player2Datas : player1Datas;
	var giverSocket = (token == player2) ? socketNb1 : socketNb1;
	if(inRange && receiver.waterLevel < receiver.maxWaterLevel && !receiver.givingWater ){
		receiver.receivingWater = true;
		if(giver.givingWater){
			exchangeWaterInterval = setInterval( () => {
				if(inRange && giver.waterLevel > 0 && giver.givingWater && receiver.receivingWater && receiver.waterLevel < receiver.maxWaterLevel){
					giver.waterLevel -= 1;
					receiver.waterLevel += 1;
					if(receiver.waterAlarmSent && receiver.waterLevel > 20 ){
						receiver.waterAlarmSent = false;
					}
					if(!giver.waterAlarmSent && giver.waterLevel <= 20 ){
						giver.waterAlarmSent = true;
						if(token == player1){
							var comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
							player2Datas.stringWriteAlarms += comma + '1';
							socketNb2.emit("alarm", {id : 1});
						}
						else{
							var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
							player1Datas.stringWriteAlarms += comma + '1';
							socketNb1.emit("alarm", {id : 1});
						}
					}
				}
				else{
					clearInterval(exchangeWaterInterval);
				}
			}, 100);
		}else{
			giverSocket.emit("message", {id : 8, status : 'textAlert'});
		}
	}
}

function trySendBattery(token){
	var giver = (token == player1) ? player1Datas : player2Datas;
	var receiver = (token == player1) ? player2Datas : player1Datas;
	var receiverSocket = (token == player1) ? socketNb2 : socketNb1;
	if(inRange && giver.battery > 0 && !giver.receivingBattery){
		giver.givingBattery = true;
		if(receiver.receivingBattery){
			exchangeBatteryInterval = setInterval( () => {
				if(inRange && giver.battery > 0 && giver.givingBattery && receiver.receivingBattery && receiver.batteryLevel < receiver.maxBatteryLevel){
					giver.battery -= 1;
					receiver.battery += 1;
					if(receiver.ownBatteryAlarmSent && receiver.battery > 20 ){
						receiver.ownBatteryAlarmSent = false;
					}
					if(!giver.ownBatteryAlarmSent && giver.battery <= 20 ){
						giver.ownBatteryAlarmSent = true;
						if(token == player1){
							var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
							player1Datas.stringWriteAlarms += comma + '2';
							socketNb1.emit("alarm", {id : 2});
						}
						else{
							var comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
							player2Datas.stringWriteAlarms += comma + '2';
							socketNb2.emit("alarm", {id : 2});
						}
					}
				}
				else{
					clearInterval(exchangeBatteryInterval);
				}
			}, 100);
		}else{
			receiverSocket.emit("message", {id : 9, status : 'textAlert'});
		}
	}
}

function tryReceiveBattery(token){
	var giver = (token == player2) ? player1Datas : player2Datas;
	var receiver = (token == player2) ? player2Datas : player1Datas;
	var giverSocket = (token == player2) ? socketNb2 : socketNb1;
	if(inRange && giver.battery > 0 && receiver.batteryLevel < receiver.maxBatteryLevel && !receiver.givingBattery){
		receiver.receivingBattery = true;
		if(receiver.receivingBattery){
			exchangeBatteryInterval = setInterval( () => {
				if(inRange &&  giver.givingBattery && receiver.receivingBattery && receiver.batteryLevel < receiver.maxBatteryLevel){
					giver.battery -= 1;
					receiver.battery += 1;
					if(receiver.ownBatteryAlarmSent && receiver.battery > 20 ){
						receiver.ownBatteryAlarmSent = false;
					}
					if(!giver.ownBatteryAlarmSent && giver.battery <= 20 ){
						giver.ownBatteryAlarmSent = true;
						if(token == player1){
							var comma = (player2Datas.stringWriteAlarms == "'") ? '' : ',';
							player2Datas.stringWriteAlarms += comma + '2';
							socketNb2.emit("alarm", {id : 2});
						}
						else{
							var comma = (player1Datas.stringWriteAlarms == "'") ? '' : ',';
							player1Datas.stringWriteAlarms += comma + '2';
							socketNb1.emit("alarm", {id : 2});
						}
					}
				}
				else{
					clearInterval(exchangeBatteryInterval);
				}
			}, 100);
		}else{
			giverSocket.emit("message", {id : 10, status : 'textAlert'});
		}
	}
}



function killAll(){
	isFinished = true;
	clearInterval(temperatureInterval);
	clearInterval(socketStates);
	clearInterval(waterRepeater);
	clearInterval(timer);
	clearInterval(sendData);
	clearInterval(calculateData);
	clearInterval(waterManagementInterval);
	clearInterval(waterFlowInterval);
	clearInterval(leaksInterval);
	clearInterval(batteryInterval);
	clearInterval(player1Datas.refillingBatteryInterval);
	clearInterval(player2Datas.refillingBatteryInterval);
	clearInterval(treeBurningInterval);
	clearInterval(exchangeBatteryInterval);
	clearInterval(exchangeWaterInterval);
	wstream.end();
	clearInterval(writeDatasInterval);
	remainingTime = 0;
	nbPlayers = 0;
	nbReadyPlayers = 0;
	player1Ready = false;
	player2Ready = false;
	gameAvailable = true;
	gameWillSoonStart = false;
	waitingTime = 15;
	socketsArray.forEach((element) => {
		element.socket.emit("remainingTimeResponse", {remainingTime : remainingTime});
	});

}

function saveScore(){
	if (teamScore>0){

    var scoreChain = fs.readFileSync('scores.json', 'UTF-8');
    var scores = JSON.parse(scoreChain);

    var rank = 0;
    
    while(rank<scores.length && scores[rank].score >= teamScore){
      rank++;
    }
    
    if(rank<10){
      newBestScore = true;
    }


    var scoreDate = new Date();
    var MyDateString = ('0' + (scoreDate.getMonth()+1)).slice(-2) + '/'
             + ('0' + scoreDate.getDate()).slice(-2) + '/'
             + scoreDate.getFullYear();
    var newDate =  MyDateString + ', ' + ('0' + scoreDate.getHours()).slice(-2) + ':' + ( '0' + scoreDate.getMinutes()).slice(-2);
    var newObject = { pseudo1 : pseudo1, score1 : player1Datas.personnalScore, pseudo2 : pseudo2, score2 : player2Datas.personnalScore, score : teamScore, date : newDate };
    
    if(scores.length==rank){
      scores.push(newObject);
    }else{ 
      var lastObject = scores[scores.length-1];
      scores.push(lastObject);
      for(var i=scores.length-1; i>rank; i--){
        scores[i].pseudo1 = scores[i-1].pseudo1;
				scores[i].score1 = scores[i-1].score1;
				scores[i].pseudo2 = scores[i-1].pseudo2;
        scores[i].score2 = scores[i-1].score2;
        scores[i].date = scores[i-1].date;
        scores[i].score = scores[i-1].score;
      }
      scores[rank] = newObject;
    }
    var newScoreChaine = JSON.stringify(scores);
    fs.writeFileSync('scores.json', newScoreChaine, 'UTF-8');
  }
}

function finishGame(id){
	saveScore();
	socketNb1.emit("gameOver", {id : id, teamScore : teamScore, personnalScore : player1Datas.personnalScore, newBestScore : newBestScore, pseudo1 : pseudo1, pseudo2 : pseudo2});
	socketNb2.emit("gameOver", {id : id, teamScore : teamScore, personnalScore : player2Datas.personnalScore, newBestScore : newBestScore, pseudo1 : pseudo2, pseudo2 : pseudo1});
	killAll();
		
	}


function firesString(){
	var myString = "'";
	var l = firesStatesOfTrees.length;
	for(var i = 0; i < l-1; i++ ){
		myString += firesStatesOfTrees[i].toString() + ',';
	}
	myString += firesStatesOfTrees[l-1].toString() + "'";
	return myString;
}

function leakPlacesString(){
	var myString = "'";
	var l = water.noLeakAt.length;
	for(var i = 0; i < l-1; i++ ){
		myString += water.noLeakAt[i].toString() + ',';
	}
	myString += water.noLeakAt[l-1].toString() + "'";
	return myString;
}


function autonomousFunction(player){
	var cap;
	var p = Math.random();
	//test d'activation du mode autonome
	if(p > probaAutonomous && !player.previouslyAutonomous && !player.autonomousMode){
		player.autonomousMode = true;
		player.previouslyAutonomous = true;
		player.rotDirection = 0;
		player.direction = 0;
	}

	//interval d'arrêt aléatoire ou quand t° trop haute

	player.stopAutonomousInterval = setInterval( () => {
	
		var p2 = Math.random();
		if(p2 > probaStopAutonomous || player.temperature >= 80){

			player.autonomousMode = false;
			player.autonomousTimeout = setTimeout( () => {
				player.previouslyAutonomous = false;
			}, 10000);
			clearInterval(player.stopAutonomousInterval);
			clearInterval(player.autonomousDecisionsInterval);
			player.rotDirection = 0;
			player.direction = 0;
		
		}
	}, 80000);

	player.hasAGoal = false;
	player.autonomousNextStep = 'computeNextGoal';

	player.autonomousDecisionsInterval = setInterval( () => {
		playerPos = { x : player.pos[0], y : player.pos[1]};
		
		if(player.autonomousNextStep == 'computeNextGoal'){
			player.autonomousDistanceThreshold = 3;
			if(player.battery/player.maxBatteryLevel < 0.5){
				player.hasAGoal = true;
				player.nextGoal = 'battery'
				player.nextPos = { x : zonesLocations.batteryZone.x + 5, y : zonesLocations.batteryZone.y + 5};
			}else if(player.waterLevel/player.maxWaterLevel < 0.5){
				player.hasAGoal = true;
				player.nextGoal = 'water'
				player.nextPos = { x : zonesLocations.waterZone.x + 5, y : zonesLocations.waterZone.y + 5};
			}else{
				var distanceMin = 200;
				for(var i = 0; i < treesLocations.length; i++){
					var nextDistance = distance(treesLocations[i], playerPos)
					if(firesStatesOfTrees[i] == 1 &&  nextDistance < distanceMin){
						player.nextPos = treesLocations[i];
						distanceMin = nextDistance;
						player.hasAGoal = true;
						player.nextGoal = 'tree';
						player.autonomousDistanceThreshold = autonomousExtinguishThreshold;
					}
				}
			}
			if(player.hasAGoal){
				player.autonomousNextStep = 'orienting';
				cap = Math.atan2(player.nextPos.y - playerPos.y, player.nextPos.x - playerPos.x);
				if(cap - player.pos[2] > Math.PI ){
					player.rotDirection = 1;
				}else{
					player.rotDirection = -1;
				}
			}
		}
		if(player.autonomousNextStep == 'orienting' && Math.abs(Math.atan2(player.nextPos.y - playerPos.y, player.nextPos.x - playerPos.x) - player.pos[2]) < autonomousCapThreshold ){
				player.autonomousNextStep = 'approach';
				console.log('coucou');
				player.rotDirection = 0;
				player.direction =1;
		}
		if(player.autonomousNextStep == 'approach' && distance(playerPos, player.nextPos) < player.autonomousDistanceThreshold){
			player.direction = 0;
			if(player.nextGoal == 'battery'){
				if(player.maxBatteryLevel - player.battery < 5){
					player.hasAGoal = false;
					player.autonomousNextStep = 'computeNextGoal';
				}
			}else if(player.nextGoal == 'water'){
				if(player.maxWaterLevel - player.waterLevel < 10){
					player.hasAGoal = false;
					player.autonomousNextStep = 'computeNextGoal';
				}
			}else if(player.nextGoal == 'tree'){
				throwWater(player, player.socket);
				player.hasAGoal = false;
				player.autonomousNextStep = 'computeNextGoal';
			}
		}else if(player.autonomousNextStep == 'approach'){
			treesLocations.forEach( (tree) => {
				if(distance(tree, playerPos) < autonomousCollidingThreshold){
					var distanceToTree = distance(playerPos, tree);
					var diffX = (tree.x - playerPos.x)/distanceToTree;
					var diffY = (tree.y - playerPos.y)/distanceToTree;
					var robotoX = Math.cos(player.pos[2]);
					var robotoY = Math.sin(player.pos[2]);
					if(scalarProduct({x : diffX, y: diffY}, {x : robotoX, y : robotoY})  > autonomousScalarProdThreshold){
						player.avoidingTree = tree;
						player.direction = 0;
						player.avoiding = true;
						player.autonomousNextStep =='avoiding';
						player.rotDirection = 1;
					}
				}
			});
		}
		if(player.autonomousNextStep == 'avoiding'){
			var distanceToTree = distance(playerPos, player.avoidingTree);
			var diffX = (player.avoidingTree.x - playerPos.x)/distanceToTree;
			var diffY = (player.avoidingTree.y - playerPos.y)/distanceToTree;
			var robotoX = Math.cos(player.pos[2]);
			var robotoY = Math.sin(player.pos[2]);
		  if(scalarProduct({x : diffX, y: diffY}, {x : robotoX, y : robotoY}) > autonomousScalarProdThreshold){
				player.rotDirection = 0;
				player.direction = 1;
				player.autonomousNextStep == 'avoiding2';
				setTimeout(() => {
					player.direction = 0;
					player.autonomousNextStep = 'orienting';
					cap = Math.atan2(player.nextPos.y - playerPos.y, player.nextPos.x - playerPos.x);
					if(cap - player.pos[2] > Math.PI ){
						player.rotDirection = 1;
					}else{
						player.rotDirection -= 1;
					}
				}, 500);			
			}
		}
	}, 20);
	
}

function scalarProduct(point1, point2){
	return point1.x*point2.x + point1.y*point2.y;
}

		




