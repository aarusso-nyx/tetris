import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrl: './keyboard.component.css'
})
export class KeyboardComponent {
  @Input() usedKeys: { [key: string]: string } = {};
  @Output() keyPress = new EventEmitter<string>();

  keyRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Delete'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Enter'],
  ];

  onKeyPress(key: string) {
    this.keyPress.emit(key);
  }

  // HostListener to capture keystrokes
  @HostListener('window:keydown', ['$event'])
  handlePhysicalKeyboard(event: KeyboardEvent) {
    let key = event.key.toLowerCase();
    console.log('Physical Keyboard:', key);

    // Handle special characters (accents)
    if (key.length === 1) {
      key = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    if (key === 'backspace' || key === 'delete') {
      event.preventDefault(); // Prevent browser from navigating back
      this.onKeyPress('delete');
    } else if (key === 'enter') {
      this.onKeyPress('enter');
    } else if (/^[a-zà-úç]$/.test(key)) {
      this.onKeyPress(key);
    }
  }
}
