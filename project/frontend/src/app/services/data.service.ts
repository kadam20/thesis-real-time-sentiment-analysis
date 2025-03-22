import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DataService {
    constructor(private http: HttpClient) {}

    getLatestTweets(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/top-tweets`)
    }

    getTimelineData(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/timeline-tracker`)
    }

    getTotalData(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/tweet-stats`)
    }

    getSentimentBins(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/sentiment-bins`)
    }

    getElectionMap(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/election-map`)
    }

    getTest(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/test`)
    }
}
