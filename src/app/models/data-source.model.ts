/**
 * Modelo JSON de configuración del origen de datos y conexión del cliente móvil.
 */
export interface DataSourceConfig {
  version: number;
  name: string;
  protocol: 'http' | 'https';
  ip: string;
  apachePort: number;
  mysqlPort: number;
  apiPath: string;
  updatedAt: string;
}
