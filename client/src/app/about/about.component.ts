import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalDatasService } from './../services/global-datas.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit, OnDestroy {

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
