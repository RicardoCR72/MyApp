import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DataSourcesPage } from './data-sources.page';

const routes: Routes = [{ path: '', component: DataSourcesPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DataSourcesPageRoutingModule {}
