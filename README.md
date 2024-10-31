# Codex Storage CLI

![CodexCLI](/images/screenshot.png)

This CLI is the easiest way to get started with [Codex](https://codex.storage). Get your node up and running in a matter of seconds and start interacting with the Codex Testnet by uploading and downloading files from the other peers in the network.

> ⚠️ Note : Codex is currently in testnet and there is no guarentee for files stored on the Codex test network. All the files uploaded to Codex are not encrypted by default and hence, the files are publicly accessible. By using this application, you agree to acknowledge the [disclaimer](https://github.com/codex-storage/codex-testnet-starter/blob/master/DISCLAIMER.md).

## How it works?

Run the Codex Storage CLI in your terminal

```
npx codexstorage
```

#### Downloading and running the Codex node

A CLI interface would appear with multiple options. Start by downloading the Codex binaries by using option 1.

![Installing]()

Once you are done downloading the binaries, you can go ahead and try running the Codex node by choosing option 2. You will be asked to enter your listening (default : 8070) and discovery (default : 8090) ports during this step.

![Running]()

#### Checking the node status

Now that your node is running, keep the terminal window open and start another instance of the Codex CLI by using the first command. We will be using this terminal to interact with the Codex node that is active.

You can checkout the node status to ensure that the node is discoverable and connected to the other peers in the Codex test network.

![Status]()

If you face any issues (peer discovery, port forwarding etc.,), join our [discord server](https://discord.gg/codex-storage) and ask for help.

#### Uploading and downloading files from the testnet

To upload a new file into the testnet, select option 4 and enter the file's relative path. A unique CID will be displayed once the file is uploaded.

![Upload]()

To download a file from the testnet, select option 5 and enter the file's CID.

![Download]()

If you wish to view all the files that are stored in your local node, choose option 6 to display all the available CIDs.

#### What's next?

More features will be added soon!