import open from "open";

export class CodexApp {
  constructor(configService) {
    this.configService = configService;
  }

  openCodexApp = async () => {
    // TODO: Update this to the main URL when the PR for adding api-port query parameter support
    // has been merged and deployed.
    // See: https://github.com/codex-storage/codex-marketplace-ui/issues/92

    const segments = [
      "https://releases-v0-0-14.codex-marketplace-ui.pages.dev/",
      "?",
      `api-port=${this.configService.get().ports.apiPort}`,
    ];

    const url = segments.join("");
    open(url);
  };
}
