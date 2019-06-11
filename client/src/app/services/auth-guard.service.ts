import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { GlobalDatasService } from'./global-datas.service';
import { Injectable } from '@angular/core';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private globalDatasService : GlobalDatasService,
                private router : Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if(this.globalDatasService.isAuth) {
            return true;
        }else{
            this.router.navigate(['/welcome']);
        }
    }
}