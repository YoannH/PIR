import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalDatasService } from '../services/global-datas.service';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit, OnDestroy {

  anotherPlayer : boolean =false;
  language : string;
  waitingTime : number;
  dot : number = 0;
  dotRepeater : NodeJS.Timer;

  launchFailedSubscription : Subscription;
  launchingGameSubscription : Subscription;
  timeBeforeStartSubscription : Subscription;

  constructor(private globalDatasService : GlobalDatasService, private socketService : SocketService) { }

  ngOnInit() {
    this.language = this.globalDatasService.language;

    this.initDotTimer();

    this.timeBeforeStartSubscription = this.socketService.onTimeBeforeStartResponse().subscribe((waitingTime) => {
        if(!this.anotherPlayer){
          this.anotherPlayer = true;
        }
        this.waitingTime = waitingTime;
    });
  }

  ngOnDestroy() {

  }

  initDotTimer(){
    this.dotRepeater = setInterval( () => {
      if(this.dot < 3){
        this.dot +=1;
      }else{
        this.dot = 0;
      }}, 1000);
  }
}
