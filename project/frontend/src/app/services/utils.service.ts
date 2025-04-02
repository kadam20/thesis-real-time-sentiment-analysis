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
        ...comparisonData,
        all_likes: comparisonData.all_likes + tweet.likes,
        all_retweets: comparisonData.all_retweets + tweet.retweet_count,
        total_tweets: comparisonData!.total_tweets + 1,
    } as ComparisonData;
    return newComparisonData;
  }
}
