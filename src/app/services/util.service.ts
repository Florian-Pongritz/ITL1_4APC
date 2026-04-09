import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class UtilService {
  constructor(
    private router: Router,
    private toastController: ToastController
  ) {}

  goToNew(path: string) {
    this.router.navigateByUrl(path);
  }

  async createToast(message: string, showCloseButton: boolean, position: 'top' | 'bottom' | 'middle') {
    return this.toastController.create({
      message,
      duration: 3000,
      position
    });
  }
}
