import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalDatasService } from '../services/global-datas.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  styleUrls: ['./howto.component.scss']
})
export class HowtoComponent implements OnInit {

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
