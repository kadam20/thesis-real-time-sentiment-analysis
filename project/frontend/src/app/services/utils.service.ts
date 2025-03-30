import { Injectable, inject, signal } from '@angular/core';
import { LocalstorageService } from './localstorage.service';
import { Tweet } from '../models/tweet.model';
import { ComparisonData } from '../models/comparison.model';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  handleNewTweet(comparisonData: ComparisonData, tweet: Tweet): ComparisonData {
    const newComparisonData = {
      tweetValues: {
        ...comparisonData.tweetValues,
        all_likes:
          comparisonData.tweetValues!.all_likes + tweet.likes,
        all_retweets: comparisonData.tweetValues!.all_retweets + tweet.retweet_count,
        total_tweets: comparisonData.tweetValues!.total_tweets + 1,
      },
      sentimentBins: { ...comparisonData.sentimentBins },
    } as ComparisonData;

    // Update tweet counts for Biden and Trump based on the candidate
    if (tweet.candidate === 'biden') {
      newComparisonData.tweetValues!.total_biden! += 1;
    } else if (tweet.candidate === 'trump') {
      newComparisonData.tweetValues!.total_trump! += 1;
    }

    // Update sentiment bins based on sentiment score
    if (tweet.sentiment_score > 0) {
      newComparisonData.tweetValues!.total_positive! += 1;

      if (tweet.candidate === 'biden') {
        newComparisonData.sentimentBins!.total_positive_biden! += 1;
      } else if (tweet.candidate === 'trump') {
        newComparisonData.sentimentBins!.total_positive_trump! += 1;
      } else {
        newComparisonData.sentimentBins!.total_positive_biden! += 1;
        newComparisonData.sentimentBins!.total_positive_trump! += 1;
      }
    } else {
      newComparisonData.tweetValues!.total_negative! += 1;

      if (tweet.candidate === 'biden') {
        newComparisonData.sentimentBins!.total_negative_biden! += 1;
      } else if (tweet.candidate === 'trump') {
        newComparisonData.sentimentBins!.total_negative_trump! += 1;
      } else {
        newComparisonData.sentimentBins!.total_negative_biden! += 1;
        newComparisonData.sentimentBins!.total_negative_trump! += 1;
      }
    }
    return newComparisonData;
  }
}
