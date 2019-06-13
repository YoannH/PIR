import { BrowserModule } from '@angular/platform-browser';
import { NgModule, InjectionToken } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { GlobalDatasService } from './services/global-datas.service';
import { AuthGuard } from './services/auth-guard.service';
import { FooterComponent } from './footer/footer.component';
import { HowtoComponent } from './howto/howto.component';
import { TrainComponent } from './train/train.component';
import { HotkeysService, HotkeyModule } from 'angular2-hotkeys';
import { ScoresComponent } from './scores/scores.component';
import { MainComponent } from './main/main.component';
import { VideodemoComponent } from './videodemo/videodemo.component';
import { AboutComponent } from './about/about.component';
import { LoadingComponent } from './loading/loading.component';
import { SocketService } from './services/socket-service';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    FooterComponent,
    HowtoComponent,
    TrainComponent,
    ScoresComponent,
    MainComponent,
    VideodemoComponent,
    AboutComponent,
    LoadingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HotkeyModule.forRoot()
  ],
  providers: [
    GlobalDatasService,
    AuthGuard, 
    SocketService,
    HotkeysService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
