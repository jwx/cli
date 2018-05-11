import {browser, element, by, By, $, $$, ExpectedConditions} from 'aurelia-protractor-plugin/protractor';

export class PageObjectSkeleton {
  getCurrentPageTitle() {
    return browser.getTitle();
  }

// @if features.navigation='navigation'
  navigateTo(href) {
    element(by.css('a[href="' + href + '"]')).click();
    return browser.waitForRouterComplete();
  }
// @endif
}
