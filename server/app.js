var express = require("express");
var app = express();


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
								startGame();
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

	});

});

//GAME DATA
const speederInit = [75, 60, Math.PI]

var player1Datas = {};
var player2Datas = {};

var player1Role;
var player2Role;

var water = {};
var waterRepeater;
var player1DatasToSend = {};
var player2DatasToSend = {};
var isFinished;
var timer;
var timeStep = 0.04;
var sendData;
var calculateData;
var waterManagementInterval;
var waterFlowInterval;
var leaksInterval;



var leakPlacesNb = 9;

function startGame(){
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
		player2Role = 'tanker';
		socketNb2.emit('role', 'tanker');
		initTanker(player2Datas);
	}

	initWater();
	player1DatasToSend.pos = player1Datas.pos;
	player1DatasToSend.other = player2Datas.pos;
	player1DatasToSend.water = water;
	player2DatasToSend.pos = player2Datas.pos;
	player2DatasToSend.other = player1Datas.pos;
	player2DatasToSend.water = water;

	isFinished = false;
	remainingTime = 300;



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

	timer = setInterval(() => {
		if(!isFinished && remainingTime > 0){
			remainingTime--;
		}else{
			clearInterval(timer);
		}
	}, 1000);


	sendData = setInterval(() => {
		if(!isFinished){		
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
	player.maxBatteryLevel = 50;
	player.transSpeed = 20;
	player.rotSpeed = 1; 
	player.rotDirection = 0;
	player.direction = 0;
}

function initTanker(player){
	player.pos = [75, 40, Math.PI];
	player.maxWaterLevel = 100;
	player.maxBatteryLevel = 100;
	player.transSpeed = 15;
	player.rotSpeed = 0.7; 
	player.rotDirection = 0;
	player.direction = 0;
}

function dataProcessing(){
	processPosition(player1Datas);
	processPosition(player2Datas);
}

function processPosition(player){
	if(player.direction === 1){
		player.pos[0] += player.transSpeed * timeStep * Math.cos(player.pos[2]);
		player.pos[1] += player.transSpeed * timeStep * Math.sin(player.pos[2]);
	}else if(player.direction === -1){
		player.pos[0] -= 0.5* player.transSpeed * timeStep * Math.cos(player.pos[2]);
		player.pos[1] -= 0.5 * player.transSpeed * timeStep * Math.sin(player.pos[2]);
	}
	for(var i = 0; i<2; i++){
		if(player.pos[i] < 0){
			player.pos[i] = 0;
		}
		if(player.pos[i] > 100){
			player.pos[i] = 100;
		}
	}
	player.pos[2] += player.rotDirection * timeStep * player.rotSpeed; 

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

function clickLeak(leakId) {
    if(water.wrenchMode) {
      water.noLeakAt[leakId] = true;
      water.wrenchMode = false;
	}
}

function wrenchOnOff(){
    water.wrenchMode = !water.wrenchMode;
}


