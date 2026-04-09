import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient, private userService: UserService) {}

  async signUp(user: any) {
    const userInfo = {
      'username': user['email'],
      'email': user['email'],
      'name': `${user['first_name']} ${user['last_name']}`,
      'phone': user['phone'],
      'password': user['password'],
      'type': 'client',
      'stripeId': user['stripeId']
    };

    return this.http.post(`${this.url}/clients/register`, userInfo).toPromise();
  }

  logIn(username: string, password: string): Observable<any> {
    return this.http.post(`${this.url}/clients/login`, { username, password });
  }

  getUser(): Observable<any> {
    const token = this.userService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.url}/clients/user`, { headers });
  }
}
