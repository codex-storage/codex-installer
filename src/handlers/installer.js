export class Installer {
  constructor(configService) {
    this.configService = configService;
  }

  isCodexInstalled = async () => {
    return false;
  }
}