import {PageObjectWelcome} from './welcome.po';
import {PageObjectSkeleton} from './skeleton.po';
import {config} from '../protractor.conf';

describe('aurelia skeleton app', function() {
  let poWelcome;
  let poSkeleton;

  beforeEach(async () => {
    poSkeleton = new PageObjectSkeleton();
    poWelcome = new PageObjectWelcome();

    await browser.loadAndWaitForAureliaPage(`http://localhost:${config.port}`);
  });

  it('should load the page and display the initial page title', async () => {
    await expect(await poSkeleton.getCurrentPageTitle()).toContain('Aurelia');
  });

// @if features.navigation!='navigation'
  it('should display greeting', async () => {
    await expect(await poWelcome.getGreeting()).toBe('Hello World!');
  });
// @endif

// @if features.navigation='navigation'
it('should display greeting', async () => {
  await expect(await poWelcome.getGreeting()).toBe('Welcome to the Aurelia Navigation App!');
});

it('should automatically write down the fullname', async () => {
  poWelcome.setFirstname('John');
  poWelcome.setLastname('Doe');

  // For now there is a timing issue with the binding.
  // Until resolved we will use a short sleep to overcome the issue.
  browser.sleep(200);
  await expect(await poWelcome.getFullname()).toBe('JOHN DOE');
});

it('should show alert message when clicking submit button', async () => {
  await expect(await poWelcome.openAlertDialog()).toBe(true);
});

it('should navigate to users page', async () => {
  poSkeleton.navigateTo('#/users');
  browser.sleep(200);
  await expect(await poSkeleton.getCurrentPageTitle()).toBe('Github Users | Aurelia');
});
// @endif
});
