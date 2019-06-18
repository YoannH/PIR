import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalDatasService } from '../services/global-datas.service';
import { SocketService } from '../services/socket-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-scores',
  templateUrl: './scores.component.html',
  styleUrls: ['./scores.component.scss']
})
export class ScoresComponent implements OnInit, OnDestroy {

  language : string = 'english';
  scores : any = [];
  scoresSubscription : Subscription;
  pagesArray : any = [];
  pagesNumber : number = 0;
  divLeft = [];
  divRight = [];
  firstPage : boolean = true;
  lastPage :boolean = false;
  pageNumber : number = 1;

  constructor( private globalDatasService : GlobalDatasService, private socketService : SocketService) {  }

  ngOnInit() {
    this.socketService.getScores();
    this.scoresSubscription = this.socketService.onScores().subscribe( (data) => {
      this.scores = data;
      for(var i = 0; i < this.scores.length; i++){
        if(i%10 == 0){
          this.pagesNumber++;
          this.pagesArray[this.pagesNumber - 1] = [];
        }
        this.pagesArray[ this.pagesNumber - 1][i%10] = this.scores[i];
      }
        this.divLeft.push(false);
        this.divRight.push(false);
        for(var i = 1; i < this.pagesNumber; i++){
          this.divRight.push(true);
          this.divLeft.push(false);
        }
        this.firstPage = true;
        this.lastPage = false;
      }
    );


    this.language = this.globalDatasService.language;
  }

  ngOnDestroy() {
    this.scoresSubscription.unsubscribe();
  }

  nextPage() {
    var pageInd = 0;
    while(this.divLeft[pageInd]){
      pageInd = pageInd + 1;
    }
    if(pageInd+1<this.pagesNumber){
      this.divLeft[pageInd] = true;
      this.divRight[pageInd+1] = false;
      this.pageNumber = this.pageNumber + 1;
    }
    this.firstPage =false;
    if(pageInd+2==this.pagesNumber){
      this.lastPage = true;
    }
  }

  previousPage() {
    var pageInd = 0;
      while(this.divLeft[pageInd]){
        pageInd = pageInd + 1;
      }
      if(pageInd>0){
        this.divRight[pageInd] = true;
        this.divLeft[pageInd-1] = false;
        this.pageNumber = this.pageNumber - 1;
      }
      this.lastPage =false;
      if(pageInd==1){
        this.firstPage = true;
      }
  }
}



