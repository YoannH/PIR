import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { GlobalDatasService} from './../services/global-datas.service';

@Component({
  selector: 'app-videodemo',
  templateUrl: './videodemo.component.html',
  styleUrls: ['./videodemo.component.scss']
})
export class VideodemoComponent implements OnInit, OnDestroy {
  
  language : string ;
  languageSubscription : Subscription;

  constructor(private globalDatasService : GlobalDatasService) {}

  ngOnInit() {
    this.languageSubscription = this.globalDatasService.languageSubject.subscribe(
      (language : string) => {
        this.language = language;
      }
    );
    this.globalDatasService.emitLanguageSubject();
    this.globalDatasService.authentify();
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

}
