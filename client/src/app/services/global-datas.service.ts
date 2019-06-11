import { Subject } from 'rxjs/Subject';

export class GlobalDatasService{

    language : string = 'english';
    isAuth : boolean = false;

    languageSubject = new Subject<string>();
    isAuthSubject = new Subject<boolean>();

    emitLanguageSubject(){
        this.languageSubject.next(this.language);
    }

    changeLanguage(newLanguage : string){
        if(newLanguage !== this.language){
            this.language = newLanguage;
            this.emitLanguageSubject();
        }
    }

    authentify(){
        this.isAuth = true;
    }
}