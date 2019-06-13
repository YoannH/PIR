export class GlobalDatasService{

    language : string = 'english';
    isAuth : boolean = false;
   
    changeLanguage(newLanguage : string){
        if(newLanguage !== this.language){
            this.language = newLanguage;
        }
    }

    authentify(){
        this.isAuth = true;
    }
}