import { Component, OnInit } from '@angular/core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import { distinctUntilChanged } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { ApiService } from 'src/app/api.service';
import { AuthService } from '@auth0/auth0-angular';
import { LoadingService } from 'src/app/loading.service';

@Component({
  selector: 'app-home-content',
  templateUrl: './home-content.component.html',
  styleUrls: ['./home-content.component.css']
})
export class HomeContentComponent implements OnInit {
  faSearch = faSearch;
  isLogined = false;

  ngOnInit() {
    this.auth.user$.subscribe(
      (profile) => {
        this.isLogined = true;
        profile.sub;
        this.api
          .getNomitations$(profile.sub)
          .subscribe(
            data => this.nominations = data
          )
      });
  }

  baseUrl: string = 'http://www.omdbapi.com/?apikey=52cd5b50&s=';
  searchTerm$ = new BehaviorSubject("");
  movies: any[];
  nominations: any[] = [];
  error: string | undefined;

  constructor(private http: HttpClient, private api: ApiService, public auth: AuthService, public loading : LoadingService) {
    this.search(this.searchTerm$)
      .subscribe(response => {
        if (!response) {
          this.error = null;
          return;
        }
        if (response.Response == "True") {
          this.error = null;
          this.movies = response.Search;

        } else {
          this.error = response.Error;
        }
      });
  }

  nominate(movie: any) {
    this.loading.add()
    this.api
      .addNomitation$({ title: movie.Title, yearOfRelease: movie.Year, imdbID: movie.imdbID })
      .subscribe({
        next: isSuccess => {
          if (isSuccess) {
            this.nominations.push({ title: movie.Title, yearofrelease: movie.Year, imdbid: movie.imdbID });
          
          } else {
            alert("Error while inserting. Please try again later")
          }
          this.loading.remove()

        },
        error: error => {
          console.log(error.message)
          this.loading.remove()
        }
      })
  }

  remove(movie: any) {
    this.loading.add()

    this.api
      .removeNomitation$(movie.imdbid)
      .subscribe({
        next: isSuccess => {
          if (isSuccess) {
            const isFoundIn = (element) => element.imdbid == movie.imdbid;
            var index = this.nominations.findIndex(isFoundIn)
            console.log(index)
            this.nominations.splice(index, 1);
          } else {
            alert("Error while removing. Please try again later")
          }
          this.loading.remove();
        },
        error: error => {
          console.log(error.message)
          this.loading.remove();
        }
      })
  }

  search(terms: BehaviorSubject<string>) {
    return terms
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(term => term != "" ? this.searchEntries(term) : of("")));
  }

  searchEntries(term) {
    return this.http
      .get(this.baseUrl + term)
      .pipe(map(res => res as any || null),
        catchError(error => throwError(error.message || error)));
  }

  canNominate(movie: any) {

    const isFoundIn = (element) => element.imdbid == movie.imdbID;

    return this.nominations.findIndex(isFoundIn) == -1;
  }

}
