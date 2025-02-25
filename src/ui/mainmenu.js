export class MainMenu {
  constructor(uiService) {
    this.ui = uiService;
  }

  show = async () => {
    this.ui.showLogo();
    this.ui.showInfoMessage("hello");
    
    await this.ui.askMultipleChoice("Select an option",[
      {
        label: "optionOne",
        action: async function() {
          console.log("A!")
        }
      },{
        label: "optionTwo",
        action: async function() {
          console.log("B!")
        }
      },
    ])
  };
}
