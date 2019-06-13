import { Component, OnInit} from '@angular/core';
import io from "socket.io-client";
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit{

 	value: number = 0;
	constructor(){}
	subscriber : Subscription;
	
	private socket: io;

	public ngOnInit(){
		this.socket = io("http://localhost:3000");
		const observable = new Observable(observer => {
			this.socket.on('recu', (data ) => {
				observer.next(data);
			});
		});
		this.subscriber = observable.subscribe((data => {this.value +=1;} ));
	}


	public envoi(data : string){
		this.socket.emit("bb", "aa");
	}
		

}
