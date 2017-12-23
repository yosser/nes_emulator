import { NesPage } from './app.po';

describe('nes App', () => {
  let page: NesPage;

  beforeEach(() => {
    page = new NesPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
