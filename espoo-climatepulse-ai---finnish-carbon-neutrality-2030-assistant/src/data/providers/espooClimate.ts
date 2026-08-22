import { EspooCityWatch } from '../schemas/espooSchema';
import { ESPOO_CLIMATE_WATCH_DATA } from '../espooData';

export function getEspooClimateWatchData(): EspooCityWatch {
  return ESPOO_CLIMATE_WATCH_DATA;
}
