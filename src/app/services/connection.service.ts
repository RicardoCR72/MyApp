import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

export interface DataSourceConfig {
  version: number;
  name: string;
  protocol: 'http';
  ip: string;
  apachePort: 80;
  mysqlPort: 3306;
  apiPath: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private static readonly CONFIG_KEY = 'data_source_config_json';
  private static readonly LEGACY_HOST_KEY = 'api_server_host';
  private config: DataSourceConfig = this.createConfig(environment.defaultApiHost);

  async initialize(): Promise<void> {
    const result = await Preferences.get({ key: ConnectionService.CONFIG_KEY });
    if (result.value) {
      try {
        this.config = this.validateConfig(JSON.parse(result.value) as Partial<DataSourceConfig>);
        return;
      } catch {
        await Preferences.remove({ key: ConnectionService.CONFIG_KEY });
      }
    }

    const legacy = await Preferences.get({ key: ConnectionService.LEGACY_HOST_KEY });
    if (legacy.value) {
      try {
        await this.setHost(legacy.value);
      } catch {
        await Preferences.remove({ key: ConnectionService.LEGACY_HOST_KEY });
      }
    }
  }

  async setHost(value: string): Promise<void> {
    const ip = this.normalizeHost(value);
    this.config = this.createConfig(ip);
    await Preferences.set({
      key: ConnectionService.CONFIG_KEY,
      value: JSON.stringify(this.config)
    });
    await Preferences.set({ key: ConnectionService.LEGACY_HOST_KEY, value: ip });
  }

  getHost(): string {
    return this.config.ip;
  }

  getConfig(): DataSourceConfig {
    return { ...this.config };
  }

  getConfigJson(): string {
    return JSON.stringify(this.config, null, 2);
  }

  getApiUrl(): string {
    return `${this.config.protocol}://${this.config.ip}:${this.config.apachePort}/${this.config.apiPath}`;
  }

  endpoint(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.getApiUrl()}${normalizedPath}`;
  }

  private createConfig(ip: string): DataSourceConfig {
    return {
      version: 1,
      name: 'XAMPP Oracle API',
      protocol: 'http',
      ip: this.normalizeHost(ip),
      apachePort: 80,
      mysqlPort: 3306,
      apiPath: environment.apiPath,
      updatedAt: new Date().toISOString()
    };
  }

  private validateConfig(value: Partial<DataSourceConfig>): DataSourceConfig {
    return {
      version: 1,
      name: value.name || 'XAMPP Oracle API',
      protocol: 'http',
      ip: this.normalizeHost(value.ip || environment.defaultApiHost),
      apachePort: 80,
      mysqlPort: 3306,
      apiPath: value.apiPath || environment.apiPath,
      updatedAt: value.updatedAt || new Date().toISOString()
    };
  }

  private normalizeHost(value: string): string {
    const withoutProtocol = value
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');

    if (!withoutProtocol || withoutProtocol.includes('/') || withoutProtocol.includes('@')) {
      throw new Error('Escribe solamente la IP del equipo, por ejemplo 192.168.1.71.');
    }

    const [hostname, port] = withoutProtocol.split(':');
    if (port && port !== '80') {
      throw new Error('Apache debe utilizar el puerto 80.');
    }

    if (hostname === 'localhost') return hostname;

    const parts = hostname.split('.');
    const validIpv4 = parts.length === 4 && parts.every(part => {
      if (!/^\d{1,3}$/.test(part)) return false;
      const octet = Number(part);
      return octet >= 0 && octet <= 255;
    });

    if (!validIpv4) {
      throw new Error('La IP no es valida. Ejemplo correcto: 192.168.1.71.');
    }

    return hostname;
  }
}
