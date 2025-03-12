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
        return this.http.get<any>(`${environment.socketUrl}/tweets`)
    }

    getTimelineData(): Observable<any> {
        return this.http.get<any>(`${environment.socketUrl}/timeline-tracker`)
    }

    getTotalData(): Observable<any> {
        return this.http.get<any>(`${environment.socketUrl}/total-data`)
    }

    getSentimentBins(): Observable<any> {
        return this.http.get<any>(`${environment.socketUrl}/sentiment-bins`)
    }
}
