import { Injectable } from '@angular/core';
import { Tweet } from '../models/tweet.model';
import { ComparisonData, SentimentBins } from '../models/comparison.model';
import { TimelineData } from '../models/timeline.model';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  // ===== TIME TRACKER COMPONENT ===== //
  /**
   * Fills the chart with the tweet data.
   * @param {TimelineData[]} timelineData Data for the tweets over time.
   */
  createTimelineChart(timelineData: TimelineData[], red: string, blue: string) {
    return {
      labels: timelineData.map((item: TimelineData) => item.month_name),
      datasets: [
        {
          label: 'Trump',
          data: timelineData.map(
            (item: TimelineData) => item.trump_sum_sentiment
          ),
          fill: false,
          borderColor: red,
          tension: 0.4,
        },
        {
          label: 'Biden',
          data: timelineData.map(
            (item: TimelineData) => item.biden_sum_sentiment
          ),
          fill: false,
          borderColor: blue,
          tension: 0.4,
        },
      ],
    };
  }

  updateTimelineChart(tweet: Tweet, timelineChart: any) {
    if (timelineChart && timelineChart.chart) {
      const len = timelineChart.chart.data.datasets[1].data.length - 1;
      // Update the chart data with the new tweet sentiment score for Biden.
      if (tweet.candidate !== 'trump') {
        timelineChart.chart.data.datasets[1].data[len] =
          Number(timelineChart.chart.data.datasets[1].data[len]) +
          tweet.sentiment_score;
      }

      // Update the chart data with the new tweet sentiment score for Trump.
      if (tweet.candidate !== 'biden') {
        timelineChart.chart.data.datasets[0].data[len] =
          Number(timelineChart.chart.data.datasets[0].data[len]) +
          tweet.sentiment_score;
      }

      // Update the chart to reflect the changes.
      timelineChart.chart.update();
    }
  }

  handleTimeNewTweet(tweet: Tweet, timelineData: TimelineData[]) {
    const newChartData = [...timelineData];
    const lastItem = newChartData[newChartData.length - 1];

    const sentiment = tweet.sentiment_score;
    lastItem.total_sum_sentiment += sentiment;

    if (tweet.candidate !== 'trump') lastItem.biden_sum_sentiment += sentiment;
    if (tweet.candidate !== 'biden') lastItem.trump_sum_sentiment += sentiment;

    return newChartData;
  }

  // ===== COMPARISON COMPONENT ===== //

  /**
   * Updates the comparison data with new tweet data.
   * @param {ComparisonData} comparisonData - The current comparison data.
   * @param {Tweet} tweet - The new tweet.
   */
  handleNewTweet(comparisonData: ComparisonData, tweet: Tweet): ComparisonData {
    return {
      ...comparisonData,
      all_likes: comparisonData.all_likes + tweet.likes,
      all_retweets: comparisonData.all_retweets + tweet.retweet_count,
      total_tweets: comparisonData!.total_tweets + 1,
    } as ComparisonData;
  }

  /**
   * Creates pie chart data for displaying tweet or sentiment data.
   * @param {number[]} data Values for the charts.
   * @param {string[]} color Colors for the charts.
   */
  createPieChart(data: number[], color: string[]) {
    return {
      datasets: [
        {
          data: data,
          backgroundColor: color,
        },
      ],
    };
  }

  /**
   * Creates bin chart data, used for displaying sentiment bins.
   * @param {SentimentBins} bins The sentiment bins data.
   */
  createBinData(bins: SentimentBins, red: string, blue: string) {
    const labels = Object.keys(bins);
    const data = Object.values(bins);
    return {
      labels: labels,
      datasets: [
        {
          label: 'Sentiment Bins',
          data: data,
          backgroundColor: Array.from({ length: 6 }, (_, i) =>
            i % 2 === 0 ? red : blue
          ),
          borderColor: ['#fff'],
          borderWidth: 2,
        },
      ],
      options: {
        legend: {
          display: false,
        },
      },
    };
  }

  /**
   * Updates the pie charts with new tweet data.
   * @param {Tweet} tweet - The new tweet.
   * @param {any} tweetPieChart - Reference to the tweet pie chart.
   * @param {any} sentimentPieChart - Reference to the sentiment pie chart.
   */
  updatePieCharts(tweet: Tweet, tweetPieChart: any, sentimentPieChart: any) {
    if (tweet.candidate !== 'trump')
      tweetPieChart.data.datasets[0].data[0] += 1;
    if (tweet.candidate !== 'biden')
      tweetPieChart.data.datasets[0].data[1] += 1;
    if (tweet.sentiment_score <= 0)
      sentimentPieChart.data.datasets[0].data[0] += 1;
    if (tweet.sentiment_score > 0)
      sentimentPieChart.data.datasets[0].data[1] += 1;

    tweetPieChart.chart.update();
    sentimentPieChart.chart.update();
  }

  /**
   * Updates the bin chart with new tweet data.
   * @param {Tweet} tweet - The new tweet.
   * @param {any} binChart - Reference to the bin chart.
   */
  updateBinChart(tweet: Tweet, binChart: any) {
    switch (true) {
      case tweet.sentiment_score <= -0.3:
        if (tweet.candidate !== 'biden')
          binChart.chart.data.datasets[0].data[0] += 1;
        if (tweet.candidate !== 'trump')
          binChart.chart.data.datasets[0].data[1] += 1;
        break;
      case tweet.sentiment_score <= 0.3 && tweet.sentiment_score > -0.3:
        if (tweet.candidate !== 'biden')
          binChart.chart.data.datasets[0].data[2] += 1;
        if (tweet.candidate !== 'trump')
          binChart.chart.data.datasets[0].data[3] += 1;
        break;
      case tweet.sentiment_score > 0.3:
        if (tweet.candidate !== 'biden')
          binChart.chart.data.datasets[0].data[4] += 1;
        if (tweet.candidate !== 'trump')
          binChart.chart.data.datasets[0].data[5] += 1;
        break;
    }
    binChart.chart.update();
  }
}
