import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalDatasService } from '../services/global-datas.service';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket-service';
import { Subscription } from 'rxjs';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  
  
  
  language : string;
  wrenchMode : boolean = false;
  alarmOverlayOpen : boolean = false;
  autonomous : boolean = false;
  upPressed : boolean = false;
  downPressed : boolean = false;
  leftPressed : boolean = false;
  rightPressed : boolean = false;
  propFromTop : number;
  propFromLeft : number;
  rotInRad : number;

  otherPropFromTop : number;
  otherPropFromLeft : number;
  otherRotInRad : number;

  gameDataSubscription : Subscription;

  constructor(private globalDatasService : GlobalDatasService, private socketService : SocketService, private router : Router, private hotkeysService : HotkeysService) { }

  ngOnInit() {
    this.hotkeysService.add( new Hotkey( 'up', (event : KeyboardEvent) : boolean => {
      if(!this.upPressed){
        console.log("up");
        this.upPressed = true;
        setTimeout(() => {
          this.upPressed = false
        }, 50);
        this.socketService.sendKey('up');
        return false;
      }      
    },
    undefined,
    'forward' ));

    this.hotkeysService.add( new Hotkey( 'down', (event : KeyboardEvent) : boolean => {
      if(!this.downPressed){
        this.downPressed = true;
        setTimeout(() => {
          this.downPressed = false
        }, 50);
        this.socketService.sendKey('down');
        return false;
      }      
    },
    undefined,
    'down' ));
  
    this.hotkeysService.add( new Hotkey( 'right', (event : KeyboardEvent) : boolean => {
      if(!this.rightPressed){
        this.rightPressed = true;
        setTimeout(() => {
          this.rightPressed = false
        }, 50);
        this.socketService.sendKey('right');
        return false;
      }      
    },
    undefined,
    'right' ));

    this.hotkeysService.add( new Hotkey( 'left', (event : KeyboardEvent) : boolean => {
      if(!this.leftPressed){
        this.leftPressed = true;
        setTimeout(() => {
          this.leftPressed = false
        }, 50);
        this.socketService.sendKey('left');
        return false;
      }      
    },
    undefined,
    'down' ));

    this.gameDataSubscription = this.socketService.onGameData().subscribe((data)=>{
      this.propFromTop = data.pos[1];
      this.propFromLeft = data.pos[0];
      this.rotInRad = data.pos[2];
      this.otherPropFromTop = data.other[1];
      this.otherPropFromLeft = data.other[0];
      this.otherRotInRad = data.other[2];

    });








    this.language = this.globalDatasService.language;

  }

}

