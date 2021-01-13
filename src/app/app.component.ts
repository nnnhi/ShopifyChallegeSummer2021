import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Auth0 Angular SDK Sample';

  constructor(public auth : AuthService, public loading : LoadingService) {
    this.auth.isLoading$.subscribe(data=>loading.remove());
  }
}
