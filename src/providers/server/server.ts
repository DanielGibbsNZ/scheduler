import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ConfigurationService} from "ionic-configuration-service";
import {LoginResponse, ValidationResponse} from "../../common/interfaces";
import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import {Logger, LoggingService} from "ionic-logging-service";
import {RootStore} from "../../store/root";

@Injectable()
export class ServerProvider {
    logger: Logger;

    constructor(public http: HttpClient,
                public store: RootStore,
                public loggingService: LoggingService,
                public config: ConfigurationService) {
        this.logger = this.loggingService.getLogger("server")
    }

    private server_url(path): string {
        let server = this.config.getValue("server");
        return `${server['url']}/api/${path}`;
    }

    isUsernameAvailableAndGood(username: string): Observable<string> {
        let url = this.server_url("validate_login/" + `?email=${username}`);
        return this.http.get(url).map(r => {
            if ('in_use' in r) {
                return r['in_use'] == false ? "good" : "bad"
            }
            return "bad";
        });
    }


    loginUser(username: string, password: string): Observable<ValidationResponse> {
        let url = this.server_url("login/" + `?email=${username}&password=${password}`);
        return this.http.get(url).map(r => {
            let res = Object.assign(new LoginResponse(), r);
            if (res.ok) {
                if (res['token'])
                    this.store.ui_store.saved_state.login_token = res['token'];
            }
            return res;
        });
    }

    validateLoginToken(): Observable<ValidationResponse> {
        let token = this.store.ui_store.saved_state.login_token;
        console.log(`Validating login token: ${JSON.stringify(token)}`);
        let url = this.server_url("validate_token/?token=" + token);
        return this.http.get(url).map(r => {
            let vr: ValidationResponse = {
                ok: r['ok'],
                reason: r['reason'],
                user: r['user']
            };
            this.store.ui_store.login_token_validated = vr.ok;
            return vr;
        })
    }

    // // I wonder, can the client use the servers google token to talk to it?
    // // Unlikely?
    // get_sheets() {
    //     this.logger.info("Listing all sheets");
    //     let sheets_only = {
    //         q: "mimeType='application/vnd.google-apps.spreadsheet'"
    //     };
    //     return Observable.create((observable) => {
    //         let url = this.server_url("/sheets/");
    //         gapi.client.drive.files.list(sheets_only).then((response) => {
    //             let files = response.result.files;
    //             // for(let file of files) {
    //             // this.logger.info("got: " + JSON.stringify(file));
    //             observable.next(files);
    //             // }
    //             observable.complete();
    //         });
    //     });
    //
    // }

    get headers() {
        if (this.store) {
            if (this.store.ui_store.signed_in) {
                let token = this.store.ui_store.saved_state.login_token;
                return new HttpHeaders({'Authorization': `Token ${token}`});
            }
        }
        return null;
    }

    get options() {
        let options = {};
        let headers = this.headers;
        if (headers) {
            options['headers'] = headers;
        }
        return options;
    }

    storeGoogleAccessCode(code: string): Observable<ValidationResponse> {
        let url = this.server_url("token/");
        this.logger.info(`Sending access token`);
        return this.http.post(url, {code: code}, this.options).map(r => {
            // If we get back a JSON with 'ok'. Otherwise expect 'detail' to contain the error.
            if (r.hasOwnProperty('ok') && r['ok']) {
                return new LoginResponse(true);
            }
            this.logger.info(`Token store returned: ${JSON.stringify(r)}`);
            return new LoginResponse(false, r['detail']);
        })
    }
}
