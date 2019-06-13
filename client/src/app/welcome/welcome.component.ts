import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalDatasService } from '../services/global-datas.service';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, OnDestroy {

  repeater : NodeJS.Timer;
  emptySlot : boolean;

  remainingTime : number ;
  language : string ;

  tokenSubscription : Subscription;
  remainingTimeSubscription : Subscription;
  playSubscription : Subscription;


  constructor(private globalDatasService : GlobalDatasService, private socketService : SocketService, private router : Router) {}

  ngOnInit() {
    this.language = this.globalDatasService.language;
    if(!this.globalDatasService.isAuth){
      this.socketService.initSocket();
      this.tokenSubscription = this.socketService.onTokenResponse().subscribe((token) => {
        this.socketService.token = token;
        this.globalDatasService.isAuth = true;
      })
      
    }
    
    this.remainingTimeSubscription = this.socketService.onRemainingTimeResponse().subscribe((remainingTime) => {
      this.initTimer(remainingTime);
    });

    this.playSubscription = this.socketService.onPlayResponse().subscribe((response) => {
      if(response === "authorized"){
        this.router.navigate(['/loading']);
      }
      else{
        this.initTimer(response);
      }
    });

    this.socketService.getRemainingTime();

  }

  play(){
    this.socketService.getPlay();
  }
  
  initTimer(remainingTime : number){
    this.remainingTime = remainingTime;
    if(this.remainingTime == 0){
      this.emptySlot = true;
    }
    else{
      this.emptySlot = false;
      clearInterval(this.repeater);
      this.repeater = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          this.emptySlot = true;
          this.remainingTime = 0;
          clearInterval(this.repeater);
        }
      }, 1000);
    }
  }

  ngOnDestroy() {
    if(this.tokenSubscription){
      this.tokenSubscription.unsubscribe();
    }
    this.remainingTimeSubscription.unsubscribe();
    this.playSubscription.unsubscribe();
  }

  changeLanguage(language : string){
    this.globalDatasService.changeLanguage(language);
  }

}
