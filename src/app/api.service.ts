import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import * as config from '../../auth_config.json';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  ping$(): Observable<any> {
    console.log(config.apiUri);
    return this.http.get(`${config.apiUri}/api/external`);
  }

  getNomitations$(userId : string) {
    return this.http.get<any[]>(`${config.apiUri}/api/nominations/${userId}`);
  }

  addNomitation$(nomination : any) : Observable<any> {
    return this.http.post(`${config.apiUri}/api/nominations`, nomination)
    .pipe(
      catchError(this.handleError<boolean>('nominate', false))
    );
  }

  removeNomitation$(imdbID : string) : Observable<any> {
    return this.http.delete(`${config.apiUri}/api/nominations/${imdbID}`)
    .pipe(
      catchError(this.handleError<boolean>('delete nomination', false))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
  
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
  
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
