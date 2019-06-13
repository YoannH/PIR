import { Component, OnInit } from '@angular/core';
import { GlobalDatasService } from './../services/global-datas.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  language : string ;


  constructor(private globalDatasService : GlobalDatasService) {}

  ngOnInit() {
    this.language = this.globalDatasService.language;
  }
}
