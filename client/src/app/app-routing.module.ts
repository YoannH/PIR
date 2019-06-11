import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WelcomeComponent} from './welcome/welcome.component';
import { AuthGuard } from './services/auth-guard.service';
import { HowtoComponent } from './howto/howto.component';
import { TrainComponent } from './train/train.component';

const routes: Routes = [
  { path: '', component : WelcomeComponent },
  { path: 'welcome', component : WelcomeComponent },
  { path: 'howto', canActivate : [AuthGuard], component : HowtoComponent },
  { path: 'train', canActivate : [AuthGuard], component : TrainComponent },
  { path: '**', component : WelcomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
