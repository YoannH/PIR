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
    }
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

  gameDataSubscription : Subscription;

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
    
    

    });
  
    this.language = this.globalDatasService.language;

  }

  ngOnDestroy(){
    this.gameDataSubscription.unsubscribe();
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

}

