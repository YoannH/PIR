import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeComponent} from './welcome/welcome.component';
import { AuthGuard } from './services/auth-guard.service';
import { HowtoComponent } from './howto/howto.component';
import { TrainComponent } from './train/train.component';
import { ScoresComponent } from './scores/scores.component';
import { VideodemoComponent } from './videodemo/videodemo.component';
import { AboutComponent } from './about/about.component';
import { LoadingComponent } from './loading/loading.component';
import { MainComponent } from './main/main.component';

const routes: Routes = [
  { path: '', component : WelcomeComponent },
  { path: 'welcome', component : WelcomeComponent },
  { path: 'howto', canActivate : [AuthGuard], component : HowtoComponent },
  { path: 'train', canActivate : [AuthGuard], component : TrainComponent },
  { path: 'scores', canActivate : [AuthGuard], component : ScoresComponent },
  { path: 'videodemo', canActivate : [AuthGuard], component : VideodemoComponent},
  { path: 'about', canActivate : [AuthGuard], component : AboutComponent},
  { path: 'loading', canActivate : [AuthGuard], component : LoadingComponent},
  { path: 'main', canActivate : [AuthGuard], component : MainComponent },
  { path: '**', component : WelcomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
