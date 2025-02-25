export class MainMenu {
  constructor(uiService) {
    this.ui = uiService;
    this.running = true;
  }

  show = async () => {
    this.ui.showLogo();
    this.ui.showInfoMessage("hello");
    
    while (this.running) {
      await this.promptMainMenu();
    }

    this.ui.showInfoMessage("K-THX-BYE");
  };

  promptMainMenu = async() => {
    await this.ui.askMultipleChoice("Select an option",[
      {
        label: "optionOne",
        action: async function() {
          console.log("A!")
        }
      },{
        label: "optionTwo",
        action: this.closeMainMenu
      },
    ])
  };

  closeMainMenu = async() => {
    console.log("B!")
    this.running = false;
  };
}
