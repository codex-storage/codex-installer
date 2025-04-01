export class MenuLoop {
    initialize = (menuPrompt) => {
        this.menuPrompt = menuPrompt;
    }

    showOnce = async () => {
        await this.menuPrompt();
    }

    showLoop = async () => {
        this.running = true;
        while (this.running) {
            await this.menuPrompt();
        }
    }

    stopLoop = () => {
        this.running = false;
    }
}
