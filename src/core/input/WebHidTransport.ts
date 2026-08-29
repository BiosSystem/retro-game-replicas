export interface HidReport { deviceId: string; reportId: number; data: Uint8Array; receivedAt: number; }

interface HidDeviceLike extends EventTarget { productName: string; vendorId: number; productId: number; opened: boolean; open(): Promise<void>; }
interface HidNavigatorLike { getDevices(): Promise<HidDeviceLike[]>; requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number }> }): Promise<HidDeviceLike[]>; }

/** Opt-in report transport. Device-specific control layouts remain user-mapped. */
export class WebHidTransport extends EventTarget {
  private devices = new Map<string, HidDeviceLike>();

  static supported() { return typeof navigator !== 'undefined' && 'hid' in navigator; }

  async connectFromUserGesture() {
    const hid = this.navigator();
    if (!hid) return [];
    const devices = await hid.requestDevice({ filters: [] });
    for (const device of devices) await this.attach(device);
    return [...this.devices.keys()];
  }

  async restoreAuthorizedDevices() {
    const hid = this.navigator();
    if (!hid) return [];
    const devices = await hid.getDevices();
    for (const device of devices) await this.attach(device);
    return [...this.devices.keys()];
  }

  private async attach(device: HidDeviceLike) {
    if (!device.opened) await device.open();
    const id = `${device.vendorId.toString(16).padStart(4, '0')}:${device.productId.toString(16).padStart(4, '0')}`;
    device.addEventListener('inputreport', event => {
      const report = event as Event & { reportId: number; data: DataView };
      this.dispatchEvent(new CustomEvent<HidReport>('report', { detail: { deviceId: id, reportId: report.reportId, data: new Uint8Array(report.data.buffer.slice(0)), receivedAt: performance.now() } }));
    });
    this.devices.set(id, device);
  }

  private navigator() { return (navigator as Navigator & { hid?: HidNavigatorLike }).hid ?? null; }
}
