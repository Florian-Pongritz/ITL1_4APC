import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { UserService } from '../services/user.service';
import { UtilService } from '../services/util.service';
import { PushService } from '../services/push.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  userForm = new FormGroup({
    'first_name': new FormControl('', [Validators.required]),
    'last_name': new FormControl('', [Validators.required]),
    'phone': new FormControl('', [Validators.required]),
    'email': new FormControl('', [Validators.required]),
    'password': new FormControl('', [Validators.required])
  });

  spinner = false;
  disabled = false;

  constructor(
    private api: ApiService,
    private userProvider: UserService,
    private util: UtilService,
    private push: PushService
  ) {}

  async registerUser() {
    if (!this.userForm.valid) {
      this.getFormValidationErrors();
      return;
    }

    this.setSpinner();
    this.api.signUp(this.userForm.value)
      .then(res => {
        this.userProvider.setToken(res['token']);
        this.api.getUser().subscribe((user: any) => {
          this.push.saveToken();
          this.userProvider.setLoggedInUser(user);
          this.clearSpinner();
          this.util.goToNew('/home');
        });
      }).catch(async err => {
        const toast = await this.util.createToast(err.error?.message || err.statusText, false, 'top');
        await toast.present();
        this.clearSpinner();
      });
  }

  getFormValidationErrors() {
    Object.keys(this.userForm.controls).forEach(key => {
      const controlErrors = this.userForm.get(key)?.errors;
      if (controlErrors) {
        console.log(`Key: ${key}, Error: `, controlErrors);
      }
    });
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
