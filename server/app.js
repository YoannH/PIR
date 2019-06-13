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
					socketsArray.forEach((element) => {
						if(element.status !== 'logged'){
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
					remainingTime = gameTime + waitingTime;
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
									if(element.status !== 'logged'){
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
			nbReadyPlayers += 1 ;
			if(playerNumber === 1){
				player1Ready = true;
			}
			else{
				player2Ready = true;
			}
		}else{
			socket.emit("launchFailed", {waitingAgain : false});
		}
	});

});






