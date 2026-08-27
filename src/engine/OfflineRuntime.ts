export type OfflineRuntimeStatus = 'READY' | 'UNSUPPORTED' | 'ERROR';

interface ServiceWorkerPort {
  register(scriptURL: string | URL, options?: RegistrationOptions): Promise<unknown>;
  readonly ready: Promise<unknown>;
}

export async function registerOfflineRuntime(
  serviceWorker: ServiceWorkerPort | undefined = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker,
  secureContext = typeof window !== 'undefined' && window.isSecureContext,
  webProtocol = typeof location !== 'undefined' && (location.protocol === 'https:' || location.protocol === 'http:'),
): Promise<OfflineRuntimeStatus> {
  if (!secureContext || !webProtocol || !serviceWorker) return 'UNSUPPORTED';
  try {
    await serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
    await serviceWorker.ready;
    return 'READY';
  } catch {
    return 'ERROR';
  }
}

export function installOfflineRuntime(enabled = import.meta.env.PROD) {
  const root = document.documentElement;
  if (!enabled) {
    root.dataset.offline = 'development';
    return;
  }
  root.dataset.offline = 'pending';
  const register = () => {
    void registerOfflineRuntime().then(status => { root.dataset.offline = status.toLowerCase(); });
  };
  if (document.readyState === 'complete') queueMicrotask(register);
  else window.addEventListener('load', register, { once: true });
}
