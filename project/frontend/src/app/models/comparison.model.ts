export class ComparisonData {
    tweetValues: TweetValues | null;
    sentimentBins: SentimentBins | null;
}

class TweetValues {
    all_likes: number;
    all_retweets: number;
    avg_sentiment: number;
    total_tweets: number;
    total_biden: number;
    total_trump: number;
    total_positive: number;
    total_negative: number;
}

export class SentimentBins {
    total_positive_biden: number;
    total_positive_trump: number;
    total_negative_biden: number;
    total_negative_trump: number;
}