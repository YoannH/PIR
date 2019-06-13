import { Component, OnInit } from '@angular/core';
import { GlobalDatasService} from './../services/global-datas.service';

@Component({
  selector: 'app-videodemo',
  templateUrl: './videodemo.component.html',
  styleUrls: ['./videodemo.component.scss']
})
export class VideodemoComponent implements OnInit {
  
  language : string ;
  
  constructor(private globalDatasService : GlobalDatasService) {}

  ngOnInit() {
    this.language = this.globalDatasService.language;
  }

}
