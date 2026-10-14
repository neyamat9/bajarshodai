import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingService } from './ping/ping.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PingService,
          useValue: {
            ping: jest.fn(),
            checkDb: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('reports that the Bazar Shodai API is running', () => {
      const res = appController.getHello();
      expect(res.success).toBe(true);
      expect(res.message).toBe('Bazar Shodai API is running');
    });
  });
});
