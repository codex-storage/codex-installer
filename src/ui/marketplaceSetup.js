const ethFaucetAddress = "https://faucet-eth.testnet.codex.storage/";
const tstFaucetAddress = "https://faucet-tst.testnet.codex.storage/";
const discordServerAddress = "https://discord.gg/codex-storage";
const botChannelLink =
  "https://discord.com/channels/895609329053474826/1230785221553819669";

export class MarketplaceSetup {
  constructor(uiService, configService, ethersService) {
    this.ui = uiService;
    this.ethers = ethersService;
    this.config = configService.get();
  }

  runClientWizard = async () => {
    await this.generateKeyPair();
    await this.showMintInstructions();
    return this.isSuccessful;
  };

  generateKeyPair = async () => {
    const ehtKey = await this.ethers.getOrCreateEthKey();

    this.ui.showSuccessMessage(
      "Your Codex node Ethereum account:\n" +
        `Private key saved to '${ehtKey.privateKeyFilePath}'\n` +
        `Address saved to '${ehtKey.addressFilePath}'\n` +
        `Ethereum Account: '${ehtKey.address}'`,
    );
  };

  showMintInstructions = async () => {
    this.ui.showInfoMessage(
      "Use one of these two methods to receive your testnet tokens:\n\n" +
        "Faucets:\n" +
        `Use the Eth faucet: '${ethFaucetAddress}'\n` +
        `Then use the TST faucet: '${tstFaucetAddress}'\n\n` +
        "or\n\n" +
        "Discord bot:\n" +
        `Join the server: ${discordServerAddress}\n` +
        `Go to the #BOT channel: ${botChannelLink}\n` +
        "Use '/set' and '/mint' commands to receive tokens.\n",
    );

    await this.ui.askMultipleChoice("Take your time.", [
      {
        label: "Proceed",
        action: this.proceed,
      },
      {
        label: "Abort",
        action: this.abort,
      },
    ]);
  };

  proceed = async () => {
    this.isSuccessful = true;
  };

  abort = async () => {
    this.isSuccessful = false;
  };
}
