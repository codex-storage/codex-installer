import axios from "axios";

export class CodexGlobals {
  getPublicIp = async () => {
    return (await axios.get(`https://ip.codex.storage`)).data;
  };

  getTestnetSPRs = async () => {
    const result = (await axios.get(`https://spr.codex.storage/testnet`)).data;
    return result.split("\n").filter((line) => line.length > 0);
  };
}
