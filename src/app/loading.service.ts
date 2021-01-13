import { Injectable } from '@angular/core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  public isLoading: boolean = true;

  add() {
    this.isLoading = true;
  }

  remove() {
    this.isLoading = false;
  }
}