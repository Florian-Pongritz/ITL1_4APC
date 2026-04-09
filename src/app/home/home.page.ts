import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { UtilService } from '../services/util.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  user: any;

  constructor(
    private userService: UserService,
    private util: UtilService
  ) {}

  ngOnInit() {
    this.user = this.userService.getLoggedInUser();
  }

  logout() {
    this.userService.logout();
    this.util.goToNew('/login');
  }
}
