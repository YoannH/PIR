var express = require("express");
var app = express();
var fs = require('fs');


var server = require('http').Server(app);
var io = require('socket.io')(server);




//VARIABLES
var gameTime = 300;
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
var token = 0;
var gameAvailable = true;
var gameWillSoonStart = false;

var upTimeout;
var downTimeout;
var leftTimeout;
var rightTimeout;

var nbPlayersLogged = 0;
server.listen(3000, () => {
	console.log("Server listening on port 3000");
});

io.on('connection', (socket) => {
	token += 1;
	socket.emit("tokenResponse", {token : token});
	socketsArray[token] = {socket : socket, status : 'connected'} ;
	socket.on("getRemainingTime", () => {
		socket.emit("remainingTimeResponse", {remainingTime : remainingTime });
	});

	//traitement lors d'une requete pour jouer (redirection vers la page de chargement 
	// et lancement ou non d'un timer)
	socket.on("getPlay", (data) => {
		var token = data.token;
		if(gameAvailable){
			socketsArray[token].status = 'logged';
			socket.emit("accessAuthorized", {});
			
			nbPlayers++;
			if(nbPlayers === 1){
				player1 = token;
			}else{
				//les 2 joueurs sont connectés dans l'écran de chargement
				if(socketsArray[player1].socket.connected){
					//on renseigne les autres connectés que le serveur est occupé
					remainingTime = gameTime + waitingTime;
					socketsArray.forEach((element) => {
						if(element.status == 'connected'){
							element.socket.emit("remainingTimeResponse", {remainingTime : remainingTime});
						}
					});

					player2 = token;
					socketNb1 = socketsArray[player1].socket;
					socketNb2 = socketsArray[player2].socket;
					gameAvailable = false;
					gameWillSoonStart = true;
					player1Ready = false;
					player2Ready = false;
					waitingTime = 15;
					
					nbReadyPlayers = 0;
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
									socketsArray[player2].status = 'connected';
									nbPlayers = 1;
								}
								else{
									if(player2Ready){
										socketNb1.emit("launchFailed", {waitingAgain : false});
										socketsArray[player1].status = 'connected';
										socketNb2.emit("launchFailed", {waitingAgain : true});
										nbPlayers = 1;
										player1 = player2;
									}
									else{
										socketNb1.emit("launchFailed", {waitingAgain : false});
										socketsArray[player1].status = 'connected';
										socketNb2.emit("launchFailed", {waitingAgain : false});
										socketsArray[player2].status = 'connected';
										nbPlayers = 0;
									}
								}
								gameAvailable = true;
								gameWillSoonStart = false;
								remainingTime = 0;

								socketsArray.forEach((element) => {
									if(element.status === 'connected'){
										element.socket.emit("remainingTimeResponse", {remainingTime : remainingTime});
									}
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
		}else if(token === player2){
			playerNumber = 2;
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
		killAll();
	});

	//key controls
	socket.on('clickLeak', (data) => {
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
		if(key == 'updown'){
			playerData.direction = 1;
		}
		else if(key == 'upup'){
			playerData.direction = 0;
		}
		else if(key =='downdown'){
			playerData.direction = -1;
		}
		else if(key =='downup'){
			playerData.direction = 0;
		}
		else if(key =='rightdown'){
			playerData.rotDirection = 1;
		}
		else if(key =='rightup'){
			playerData.rotDirection = 0;
		}
		else if(key =='leftdown'){
			playerData.rotDirection = -1;
		}
		else if(key =='leftup'){
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

var player1Datas ;
var player2Datas ;

var player1DatasToSend ;
var player2DatasToSend ;

var water ;

var treesLocations;
var zonesLocations;


var timeStep = 0.04;
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








function initGame(){

	socketStates = setInterval( () => {
		if(!socketNb1.connected || !socketNb2.connected){
			killAll();
		}
	}, 1000);
	teamScore = 0;
	player1Datas = {};
	player2Datas = {};
	player1DatasToSend = {};
	player2DatasToSend = {};
	water = {};

	var p = Math.random();
	if(p > 0.5){
		player1Role = 'tanker';
		socketNb1.emit('role', 'tanker');
		initTanker(player1Datas);

		socketNb2.emit('role', 'speeder');
		initSpeeder(player2Datas);
	}else{
		player1Role = 'speeder';
		socketNb1.emit('role', 'speeder');
		initSpeeder(player1Datas);
		socketNb2.emit('role', 'tanker');
		initTanker(player2Datas);
	}


	isFinished = false;
	remainingTime = 600;
	
	player1DatasToSend.pos = player1Datas.pos;
	player1DatasToSend.other = player2Datas.pos;
	player1DatasToSend.water = water;	
	player1Datas.battery = player1Datas.maxBatteryLevel;
	player1Datas.noBattery = false;
	

	player2DatasToSend.pos = player2Datas.pos;
	player2DatasToSend.other = player1Datas.pos;
	player2DatasToSend.water = water;
	player2DatasToSend.remainingTime = remainingTime;
	player2Datas.battery = player2Datas.maxBatteryLevel;
	player2Datas.noBattery = false;
	
	

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


	calculateData = setInterval(() => {
		if(!isFinished){
			dataProcessing();
		}else{
			clearInterval(calculateData);
		}
	}, 40);

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
		
	}, 1000);

	batteryInterval = setInterval(() => {
		if(player1Datas.battery > 0){
			player1Datas.battery--;
			if(player1Datas.noBattery){
				player1Datas.noBattery = false;
			}
		}else{
			player1Datas.noBattery = true;
		}
		if(player2Datas.battery > 0){
			if(player2Datas.noBattery){
				player2Datas.noBattery = false;
			}
			player2Datas.battery--;
		}else{
			player2Datas.noBattery = true;
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
		}else{
			clearInterval(timer);
		}
	}, 1000);


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

			player2Datas.batteryLevel = player2Datas.battery/player2Datas.maxBatteryLevel *100;
			player2DatasToSend.batteryLevel = player2Datas.batteryLevel;
			player2DatasToSend.waterLevel = player2Datas.waterLevel/player2Datas.maxWaterLevel * 100;
			player2DatasToSend.remainingTime = remainingTime;		
			player2DatasToSend.noBattery = player2Datas.noBattery;
			player2DatasToSend.inRange = inRange;
			player2DatasToSend.teamScore = teamScore;
			player2DatasToSend.personnalScore = player2Datas.personnalScore;
			player2DatasToSend.temperature = player2Datas.temperature;

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
	}
	for(var i = 0; i<2; i++){
		if(player.pos[i] < 0){
			player.pos[i] = 0;
		}
		if(player.pos[i] > 100){
			player.pos[i] = 100;
		}
	}
	

	if(!player.isRefillingBattery && player.pos[0] > zonesLocations.batteryZone.x && player.pos[0] < zonesLocations.batteryZone.x + 10 && player.pos[1] > zonesLocations.batteryZone.y && player.pos[1] < zonesLocations.batteryZone.y + 10){
			player.isRefillingBattery = true;
			player.refillingBatteryInterval = setInterval(() => {
				if(player.isRefillingBattery && player.pos[0] > zonesLocations.batteryZone.x && player.pos[0] < zonesLocations.batteryZone.x + 10 && player.pos[1] > zonesLocations.batteryZone.y && player.pos[1] < zonesLocations.batteryZone.y + 10){
					if(player.battery/player.maxBatteryLevel*100 < 99 ){
						player.battery += 1 * player.maxBatteryLevel/100;
					}else{
						player.battery = player.maxBatteryLevel;
					}
				}else{
					player.isRefillingBattery = false;
					clearInterval(player.refillingBatteryInterval);
				}
			}, 50);
	}
	if(!player.isRefillingWater && player.pos[0] > zonesLocations.waterZone.x && player.pos[0] < zonesLocations.waterZone.x + 10 && player.pos[1] > zonesLocations.waterZone.y && player.pos[1] < zonesLocations.waterZone.y + 10){
		player.isRefillingWater = true;
		player.refillingWaterInterval = setInterval(() => {
			if(player.isRefillingWater && player.pos[0] > zonesLocations.waterZone.x && player.pos[0] < zonesLocations.waterZone.x + 10 && player.pos[1] > zonesLocations.waterZone.y && player.pos[1] < zonesLocations.waterZone.y + 10){
				if(player.waterLevel  < player.maxWaterLevel && water.waterLevelContainer >= 10 ){
					player.waterLevel += 10;
					water.waterLevelContainer -= 10
					if(player.waterLevel > player.maxWaterLevel){
						player.waterLevel = player.maxWaterLevel;
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
	if(inRange && giver.batteryLevel > 0 && !giver.receivingBattery){
		giver.givingBattery = true;
		if(receiver.receivingBattery){
			exchangeBatteryInterval = setInterval( () => {
				if(inRange && giver.batteryLevel> 0 && giver.givingBattery && receiver.receivingBattery && receiver.batteryLevel < receiver.maxBatteryLevel){
					giver.batteryLevel -= 1;
					receiver.batteryLevel += 1;
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
	if(inRange && giver.batteryLevel > 0 && receiver.batteryLevel < receiver.maxBatteryLevel && !receiver.givingBattery){
		receiver.receivingBattery = true;
		if(receiver.receivingBattery){
			exchangeBatteryInterval = setInterval( () => {
				if(inRange &&  giver.givingBattery && receiver.receivingBattery && receiver.batteryLevel < receiver.maxBatteryLevel){
					giver.batteryLevel -= 1;
					receiver.batteryLevel += 1;
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
	socketNb1.emit("disconnected", {});
	socketNb2.emit("disconnected", {});
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

