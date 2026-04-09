import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { UserService } from '../services/user.service';
import { UtilService } from '../services/util.service';
import { PushService } from '../services/push.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  user: any = { email: '', password: '' };
  spinner = false;
  disabled = false;

  constructor(
    private api: ApiService,
    private userProvider: UserService,
    private util: UtilService,
    private push: PushService
  ) {}

  login() {
    this.setSpinner();
    this.api.logIn(this.user.email, this.user.password)
      .subscribe(
        (res: any) => {
          this.userProvider.setToken(res['token']);
          this.api.getUser().subscribe((responseUser: any) => {
            this.push.saveToken();
            this.userProvider.setLoggedInUser(responseUser);
            this.clearSpinner();
            this.util.goToNew('/home');
          });
        },
        async (err: any) => {
          const toast = await this.util.createToast(
            err.error?.info?.message || 'Login failed', false, 'top'
          );
          await toast.present();
          this.clearSpinner();
        }
      );
  }

  setSpinner() {
    this.spinner = true;
    this.disabled = true;
  }

  clearSpinner() {
    this.spinner = false;
    this.disabled = false;
  }
}
