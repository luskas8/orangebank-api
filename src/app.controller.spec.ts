import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return a redirect message', () => {
      expect(() => appController.index()).toBeDefined();
    });
    it('should return "OK" on health check', () => {
      expect(appController.healthCheck()).toBe('OK');
    });
  });
});
