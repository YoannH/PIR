import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { GlobalDatasService } from '../services/global-datas.service';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket-service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  
  @HostListener('document:keydown', ['$event']) onKeydown(event : KeyboardEvent){
    if(event.keyCode === 38 && !this.upPressed ){
      this.upPressed = true;
      this.downPressed = false;
      this.socketService.sendKey('updown');
    }else if(event.keyCode === 40 && !this.downPressed){
      this.downPressed = true;
      this.upPressed = false;
      this.socketService.sendKey('downdown');
    }else if(event.keyCode === 37 && !this.leftPressed){
      this.leftPressed = true;
      this.rightPressed = false;
      this.socketService.sendKey('leftdown');
    }else if(event.keyCode === 39 && !this.rightPressed){
      this.rightPressed = true;
      this.leftPressed = false;
      this.socketService.sendKey('rightdown');
    }else if(event.keyCode === 65 && !this.aPressed){
      this.aPressed = true;
      this.socketService.sendKey('a');
    }else if(event.keyCode === 83 && !this.sPressed){
      this.sPressed = true;
      this.socketService.sendKey('s');
    }else if(event.keyCode === 68 && !this.dPressed){
      this.dPressed = true;
      this.socketService.sendKey('d');
    }else if(event.keyCode === 69 && !this.ePressed){
      this.ePressed = true;
      this.socketService.sendKey('e');
    }else if(event.keyCode === 32 && !this.spacePressed){
      this.spacePressed = true;
      this.socketService.sendKey('space');
    }
  }

  @HostListener('document:keyup', ['$event']) onKeyup(event : KeyboardEvent){
    if(event.keyCode === 38 && this.upPressed){
      this.upPressed = false;
      this.socketService.sendKey('upup');
    }else if(event.keyCode === 40 && this.downPressed){
      this.downPressed = false;
      this.socketService.sendKey('downup');
    }else if(event.keyCode === 37 && this.leftPressed){
      this.leftPressed = false;
      this.socketService.sendKey('leftup');
    }else if(event.keyCode === 39 && this.rightPressed){
      this.rightPressed = false;
      this.socketService.sendKey('rightup');
    }else if(event.keyCode === 65){
      this.aPressed = false;    
    }else if(event.keyCode === 83){
      this.sPressed = false;    
    }else if(event.keyCode === 68){
      this.dPressed = false;    
    }else if(event.keyCode === 69){
      this.ePressed = false;    
    }else if(event.keyCode === 32){
      this.spacePressed = false;    
    }
  }

  @HostListener('window:popstate', ['$event'])  onPopState(event) {
    this.socketService.killAll();
    this.globalDatasService.popState = true;
  }
  
  
  language : string;
  wrenchMode : boolean = false;
  alarmOverlayOpen : boolean = false;
  autonomous : boolean = false;
  upPressed : boolean = false;
  downPressed : boolean = false;
  leftPressed : boolean = false;
  rightPressed : boolean = false;
  aPressed : boolean = false;
  sPressed : boolean = false;
  dPressed : boolean = false;
  ePressed : boolean = false;
  spacePressed : boolean = false;
  propFromTop : number;
  propFromLeft : number;
  rotInRad : number;

  //control x axis
  faucetControl : number = 0;
  faucetControlShow : string = '0';
  direction : number = 0;
  animTime : number = 0;

  //waterTap
  waterWidth : number = 0;
  callCount : number = 0;

 


  //leaks
  leakPlacesNb : number = 9;
  leakPlaces : number[] = [];
  noLeakAt : boolean[] = [];
  previousNoLeakAt : boolean[] = [];
  leaksReverse : number[] = [];
  leftValues : number[] = [];
  leakCounter : number = 0;

  //water management
  xRobinet : number = 42;
  coeffSpeed : number = 20;
  piValue : number = 3.1415;
  decal : number = 4;
  faucetXAxis : number = 2 * 10 / 40;
  yRobinet : number ;
  coeffXRob : number = 10;
  constXRob : number = 50;
  waterLevelContainer : number = 50;

  otherPropFromTop : number;
  otherPropFromLeft : number;
  otherRotInRad : number;

  nbFighted : number = 0;
  remainingTime : number = 600;
  temperature : number = 0;
  hotScreen : number = 0;

  role : string ;
  trees : any;
  zones : any = { batteryZone : { x : 0, y : 0},
                  waterZone : { x : 0, y : 0}};

  fires : any;

  watLevel : number = 50;

  waterize : boolean = false;

  batteryLevel : number = 100;
  treesLocationsSubscription : Subscription;
  zonesLocationsSubscription : Subscription;
  roleSubscription : Subscription;
  gameDataSubscription : Subscription;
  disconnectionSubscription : Subscription;
  waterThrowedSubscription : Subscription;

  constructor(private globalDatasService : GlobalDatasService, private socketService : SocketService, private router : Router) { }

  ngOnInit() {
    // this.hotkeysService.add( new Hotkey( 'up', (event : KeyboardEvent) : boolean => {
    //   // if(!this.upPressed){
    //   //   console.log("up");
    //   //   this.upPressed = true;
    //   //   setTimeout(() => {
    //   //     this.upPressed = false
    //   //   }, 50);
    //     this.socketService.sendKey('up');
    //     return false;
    //   //}      
    // },
    // undefined,
    // 'forward' ));

    // this.hotkeysService.add( new Hotkey( 'down', (event : KeyboardEvent) : boolean => {
    //   // if(!this.downPressed){
    //   //   this.downPressed = true;
    //   //   setTimeout(() => {
    //   //     this.downPressed = false
    //   //   }, 50);
    //     this.socketService.sendKey('down');
    //     return false;
    //  // }      
    // },
    // undefined,
    // 'down' ));
  
    // this.hotkeysService.add( new Hotkey( 'right', (event : KeyboardEvent) : boolean => {
    //   // if(!this.rightPressed){
    //   //   this.rightPressed = true;
    //   //   setTimeout(() => {
    //   //     this.rightPressed = false
    //   //   }, 50);
    //     this.socketService.sendKey('right');
    //     return false;
    // //  }      
    // },
    // undefined,
    // 'right' ));

    // this.hotkeysService.add( new Hotkey( 'left', (event : KeyboardEvent) : boolean => {
    //   // if(!this.leftPressed){
    //   //   this.leftPressed = true;
    //   //   setTimeout(() => {
    //   //     this.leftPressed = false
    //   //   }, 20);
    //     this.socketService.sendKey('left');
    //     return false;
    //  // }      
    // },
    // undefined,
    // 'down' ));
 
    this.treesLocationsSubscription = this.socketService.onTreesLocations().subscribe((trees) => {
      this.trees = trees;
    });

    this.zonesLocationsSubscription = this.socketService.onZonesLocations().subscribe((zones) => {
      this.zones = zones;
    });

    this.roleSubscription = this.socketService.onRoles().subscribe((role) => {
      this.role = role;
    });

    this.disconnectionSubscription = this.socketService.onDisconnected().subscribe(() => {
      this.router.navigate(['/welcome']);
    });

    this.waterThrowedSubscription = this.socketService.onWaterThrowed().subscribe(() => {
      this.waterize = true;
      setTimeout(() => {
        this.waterize = false;
      }, 100);
    });
    

    this.gameDataSubscription = this.socketService.onGameData().subscribe((data)=>{
      this.propFromTop = data.pos[1];
      this.propFromLeft = data.pos[0];
      this.rotInRad = data.pos[2];
      this.otherPropFromTop = data.other[1];
      this.otherPropFromLeft = data.other[0];
      this.otherRotInRad = data.other[2];
      let water = data.water; 
     
      this.wrenchMode = water.wrenchMode;
      this.animTime = water.animTime;
      this.direction = water.direction;
      this.xRobinet = water.xRobinet;
      this.yRobinet = water.yRobinet;
      this.waterWidth = water.waterWidth;
      this.faucetXAxis = water.faucetXAxis;
      this.waterLevelContainer = water.waterLevelContainer;
      this.leakPlaces = water.leakPlaces;
      this.noLeakAt = water.noLeakAt;
      this.leaksReverse = water.leaksReverse;
      this.leftValues = water.leftValues;
      this.faucetControl = water.faucetControl;
    
      this.remainingTime = data.remainingTime;
      this.batteryLevel = data.batteryLevel;
    
      this.watLevel = data.waterLevel;
      this.fires = data.fires;
      this.nbFighted = data.teamScore;
      this.temperature = data.temperature;
      console.log(data.temperature);
      this.hotScreen = this.temperature/100;
    });
  
    this.language = this.globalDatasService.language;

    this.socketService.readyToPlay();
  }

  ngOnDestroy(){
    this.gameDataSubscription.unsubscribe();
    this.treesLocationsSubscription.unsubscribe();
    this.zonesLocationsSubscription.unsubscribe();
    this.roleSubscription.unsubscribe();
    this.disconnectionSubscription.unsubscribe();
  }


  clickLeak(key : number){
    this.socketService.clickLeak(key);
  }

  faucetCtrlFctMinus(){
    this.socketService.sendKey('s');
  }

  faucetCtrlFctPlus(){
    this.socketService.sendKey('d');
  }

  waterPushButton(){
    this.socketService.sendKey('e');
  }

  wrenchOnOff(){
    this.socketService.sendKey('a');
  }

  killAll(){
    this.socketService.killAll();
    this.router.navigate(['/welcome']);
  }
}

