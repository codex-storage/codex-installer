import axios from "axios";

export class CodexGlobals {
  getPublicIp = async () => {
    const result = (await axios.get(`https://ip.codex.storage`)).data;
    return result.replaceAll("\n", "");
  };

  getTestnetSPRs = async () => {
    const result = (await axios.get(`https://spr.codex.storage/testnet`)).data;
    return result.split("\n").filter((line) => line.length > 0);
  };

  getEthProvider = () => {
    return "https://rpc.testnet.codex.storage";
  }
}
