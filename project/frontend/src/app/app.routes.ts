import { Routes } from '@angular/router';
import { ElectionMapComponent } from './components/election-map/election-map.component';
import { RouteEnums } from './enums/route.enum';
import { TimeTrackerComponent } from './components/time-tracker/time-tracker.component';
import { ComparisonComponent } from './components/comparison/comparison.component';

export const routes: Routes = [
  { path: RouteEnums.ELECTION_MAP, component: ElectionMapComponent },
  { path: RouteEnums.TIME_TRACKER, component: TimeTrackerComponent },
  { path: RouteEnums.COMPARISON, component: ComparisonComponent },
  { path: '**', redirectTo: RouteEnums.ELECTION_MAP },
];
