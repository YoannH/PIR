import { Component, OnInit } from '@angular/core';
import { GlobalDatasService } from '../services/global-datas.service';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  styleUrls: ['./howto.component.scss']
})
export class HowtoComponent implements OnInit{

  language : string ;


  constructor(private globalDatasService : GlobalDatasService) {}

    ngOnInit() {
      this.language = this.globalDatasService.language;
    }
  }
