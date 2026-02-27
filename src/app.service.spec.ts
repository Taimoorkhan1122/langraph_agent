import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('returns hello message', () => {
    expect(service.getHello()).toBe('Hello World!');
  });
});
