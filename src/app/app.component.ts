import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  analyticsOutline,
  arrowForwardOutline,
  baseballOutline,
  closeOutline,
  cloudDownloadOutline,
  createOutline,
  hardwareChipOutline,
  logOutOutline,
  mailOutline,
  optionsOutline,
  peopleOutline,
  personAddOutline,
  personCircleOutline,
  phonePortraitOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
    addIcons({
      'analytics-outline': analyticsOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'baseball-outline': baseballOutline,
      'close-outline': closeOutline,
      'cloud-download-outline': cloudDownloadOutline,
      'create-outline': createOutline,
      'hardware-chip-outline': hardwareChipOutline,
      'log-out-outline': logOutOutline,
      'mail-outline': mailOutline,
      'options-outline': optionsOutline,
      'people-outline': peopleOutline,
      'person-add-outline': personAddOutline,
      'person-circle-outline': personCircleOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'refresh-outline': refreshOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'sparkles-outline': sparklesOutline,
      'trash-outline': trashOutline
    });
  }
}
