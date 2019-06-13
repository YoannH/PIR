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
	socket.on('key', (data) => {
		var playerData;
		if(data.token === player1){
			playerData = player1Datas;
		}else{
			playerData = player2Datas;
		}
		var key = data.key;
		if(key == 'up'){
			playerData.direction = 1;
			if(upTimeout){clearTimeout(upTimeout);}
			upTimeout = setTimeout(() => { playerData.direction = 0}, 100);
		}
		else if(key =='down'){
			playerData.direction = -1;
			if(downTimeout){clearTimeout(downTimeout);}
			downTimeout = setTimeout(() => { playerData.direction = 0}, 100);
		}
		else if(key =='left'){
			playerData.rotDirection = -1;
			if(leftTimeout){clearTimeout(leftTimeout);}
			leftTimeout = setTimeout(() => { playerData.rotDirection = 0}, 100);
		}
		else if(key =='right'){
			playerData.rotDirection = 1;
			if(rightTimeout){clearTimeout(rightTimeout);}
			rightTimeout = setTimeout(() => { playerData.rotDirection = 0}, 100);
		}

	});

});

//GAME DATA
const speederInit = [75, 60, Math.PI]

var player1Datas = {};
var player2Datas = {};

var player1Role;
var player2Role;

var player1DatasToSend = {};
var player2DatasToSend = {};
var isFinished;
var timer;
var timeStep = 0.04;
var sendData;
var calculateData;
var player1Data = {};
var player2Data = {};
var player1Forward = false;
var player2Forward = false;


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
	player1DatasToSend.pos = player1Datas.pos;
	player1DatasToSend.other = player2Datas.pos;
	player2DatasToSend.pos = player2Datas.pos;
	player2DatasToSend.other = player1Datas.pos;

	isFinished = false;
	remainingTime = 300;

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

	calculateData = setInterval(() => {
		if(!isFinished){
			dataProcessing();
		}else{
			clearInterval(calculateData);
		}
	}, 40);
	
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
	player.pos[2] += player.rotDirection * timeStep * player.rotSpeed; 

}




