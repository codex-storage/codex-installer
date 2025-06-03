import open from "open";

export class FeedbackService {
  openFeedbackPage = async () => {
    const segments = [
      "https://tally.so/r/w2DlXb",
    ];

    const url = segments.join("");
    open(url);
  };
}
