
export interface AdminConfig {
    appName: string;
    supportEmail: string;
    currency: 'BRL' | 'USD';
    timezone: string;
    maintenanceMode: boolean;
    allowSignups: boolean;
    autoBlock: {
        enabled: boolean;
        daysTolerance: number;
    };
}

const ADMIN_CONFIG_KEY = 'movicobranca_admin_config';

const DEFAULT_CONFIG: AdminConfig = {
    appName: 'Movicobrança',
    supportEmail: 'suporte@movicobranca.com',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    maintenanceMode: false,
    allowSignups: true,
    autoBlock: {
        enabled: true,
        daysTolerance: 5
    }
};

export const adminSettingsService = {
    getConfig: async (): Promise<AdminConfig> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const stored = localStorage.getItem(ADMIN_CONFIG_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge com default para garantir que novas props existam
            return { ...DEFAULT_CONFIG, ...parsed };
        }
        return DEFAULT_CONFIG;
    },

    saveConfig: async (config: AdminConfig): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
    }
};
