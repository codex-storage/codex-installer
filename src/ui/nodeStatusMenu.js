import chalk from "chalk";

export class NodeStatusMenu {
  constructor(uiService, dataService, menuLoop) {
    this.ui = uiService;
    this.dataService = dataService;
    this.loop = menuLoop;

    this.loop.initialize(this.showNodeStatusMenu);
  }

  showNodeStatus = async () => {
    this.debugInfo = await this.fetchDebugInfo();
    if (debugInfo == undefined) return;

    const peerCount = this.debugInfo.table.nodes.length;
    const isOnline = peerCount > 2;

    if (isOnline) {
      this.showSuccessMessage(
        "Node is ONLINE & DISCOVERABLE",
        "🔌 Node Status"
      )
    } else {
      this.showInfoMessage(
        "Node is ONLINE but has few peers",
        "🔌 Node Status"
      )
    }

    await this.loop.showLoop();
  };

  showNodeStatusMenu = async () => {
    await this.ui.askMultipleChoice("Select information to view:", [
      {
        label: "View connected peers",
        action: this.showPeers,
      },
      {
        label: "View node information",
        action: this.showNodeInfo,
      },
      {
        label: "Back to Main Menu",
        action: this.loop.stopLoop,
      },
    ]);
  };

  showPeers = async () => {
    const peerCount = this.debugInfo.table.nodes.length;
    if (peerCount > 0) {
        this.ui.showInfoMessage('Connected Peers');
        this.debugInfo.table.nodes.forEach((node, index) => {
          this.ui.showInfoMessage(
                `Peer ${index + 1}:\n` +
                `${chalk.cyan('Peer ID:')} ${node.peerId}\n` +
                `${chalk.cyan('Address:')} ${node.address}\n` +
                `${chalk.cyan('Status:')} ${node.seen ? chalk.green('Active') : chalk.gray('Inactive')}`,
            );
        });
    } else {
      this.ui.showInfoMessage('No connected peers found.');
    }
  };

  showNodeInfo = async () => {
    const data = this.debugInfo;
    this.ui.showInfoMessage(
      `${chalk.cyan('Version:')} ${data.codex.version}\n` +
      `${chalk.cyan('Revision:')} ${data.codex.revision}\n\n` +
      `${chalk.cyan('Node ID:')} ${data.table.localNode.nodeId}\n` +
      `${chalk.cyan('Peer ID:')} ${data.table.localNode.peerId}\n` +
      `${chalk.cyan('Listening Address:')} ${data.table.localNode.address}\n\n` +
      `${chalk.cyan('Public IP:')} ${data.announceAddresses[0].split('/')[2]}\n` +
      `${chalk.cyan('Port:')} ${data.announceAddresses[0].split('/')[4]}\n` +
      `${chalk.cyan('Connected Peers:')} ${data.table.nodes.length}`,
    );
  };

  fetchDebugInfo = async () => {
    const spinner = this.ui.createAndStartSpinner("Fetching...");
    try {
      return await this.dataService.debugInfo();
    }
    catch {
      this.ui.showErrorMessage("Failed to fetch debug/info");
      return;
    }
    finally {
      this.ui.stopSpinnerSuccess(spinner);
    }
  }
}
