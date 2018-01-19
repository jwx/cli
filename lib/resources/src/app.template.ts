// @if features.navigation='navigation'
import {Router, RouterConfiguration} from 'aurelia-router';

// @endif
export class App {
// @if features.navigation!='navigation'
  public message: string = 'Hello World!';
// @endif
// @if features.navigation='navigation'
  public router: Router;

  public configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Aurelia';
    config.map([
      { route: ['', 'welcome'], name: 'welcome',      moduleId: 'welcome',      nav: true, title: 'Welcome' },
      { route: 'users',         name: 'users',        moduleId: 'users',        nav: true, title: 'Github Users' },
      { route: 'child-router',  name: 'child-router', moduleId: 'child-router', nav: true, title: 'Child Router' }
    ]);

    this.router = router;
  }
// @endif
}
