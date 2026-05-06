import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { HeroComponent } from './shared/hero/hero.component';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,   NavbarComponent, FooterComponent, HeroComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'buenamielda-front';
}
