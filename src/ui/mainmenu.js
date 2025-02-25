export class MainMenu {
  constructor(uiService) {
    this.ui = uiService;
  }

  show = () => {
    this.ui.showInfoMessage("hello");
  };
}
