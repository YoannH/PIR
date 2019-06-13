import { Injectable } from '@angular/core';
import { Observable } from'rxjs/Observable';


import io from 'socket.io-client';


@Injectable()
export class SocketService {
    private socket : io;
    public token : number;

    public initSocket() : void {
        this.socket = io("http://localhost:3000");    
    }

    public send(message : string, data : any) : void {
        this.socket.emit(message, data);
    }

    public getToken() : void {
        this.socket.emit("getToken");
    }

    public getRemainingTime() : void {
        this.socket.emit("getRemainingTime");
    }

    public getPlay() : void {
        this.socket.emit("getPlay", { token : this.token });
    }

    public sendReady() : void {
        this.socket.emit("ready", { token : this.token });
    }

    public onTokenResponse(): Observable<any>{
        return new Observable<any>( observer => {
            this.socket.on('tokenResponse' , (data) => {observer.next(data.token);
            });
        });
    }


    public onRemainingTimeResponse() : Observable<any>{
        return new Observable<any>( observer => {
            this.socket.on('remainingTimeResponse' , (data) => {observer.next(data.remainingTime);
            });
        });
    }

    public onPlayResponse(){
        return new Observable<any>( observer => {
            this.socket.on('accessAuthorized' , () => {observer.next('authorized')});
            this.socket.on('accessDenied' , (data) => {observer.next(data.remainingTime)});
        });
    }

    public onTimeBeforeStartResponse(){
        return new Observable<any>( observer => {
            this.socket.on('timeBeforeStart', (data) => {observer.next(data.timeBeforeStart);});
        });
    }

    public onLaunchingGameResponse(){
        return new Observable<any>( observer => {
            this.socket.on('launchingGame', () => {observer.next();});
        });
    }

    public onLaunchFailedResponse(){
        return new Observable<any>( observer => {
            this.socket.on('launchFailed', (data) => {observer.next(data.waitingAgain);});
        });
    }


}