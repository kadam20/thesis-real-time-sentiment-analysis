import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Tweet } from '../models/tweet.model';
import { TimelineData } from '../models/timeline.model';
import { ComparisonData, SentimentBins } from '../models/comparison.model';
import { StateData } from '../models/state.model';

@Injectable({
    providedIn: 'root',
})
export class DataService {
    constructor(private http: HttpClient) {}

    getLatestTweets(): Observable<Tweet[]> {
        return this.http.get<Tweet[]>(`${environment.apiUrl}/top-tweets`)
    }

    getTimelineData(): Observable<TimelineData[]> {
        return this.http.get<TimelineData[]>(`${environment.apiUrl}/timeline-tracker`)
    }

    getTotalData(): Observable<ComparisonData> {
        return this.http.get<ComparisonData>(`${environment.apiUrl}/tweet-stats`)
    }

    getSentimentBins(): Observable<SentimentBins> {
        return this.http.get<SentimentBins>(`${environment.apiUrl}/sentiment-bins`)
    }

    getElectionMap(): Observable<StateData[]> {
        return this.http.get<StateData[]>(`${environment.apiUrl}/election-map`)
    }
}
