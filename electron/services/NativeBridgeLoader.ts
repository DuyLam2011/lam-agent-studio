import path from 'path';
import fs from 'fs';

export class NativeBridgeLoader {
  private static nativeBinding: any = null;
  private static loaded = false;
  private static loadAttempted = false;

  public static getNative(): any {
    if (this.loadAttempted) return this.nativeBinding;
    this.loadAttempted = true;

    const candidates = [
      path.join(__dirname, '../../crates/lam-agent-core/lam_agent_core.node'),
      path.join(__dirname, '../../crates/lam-agent-core/target/release/lam_agent_core.node'),
      path.join(__dirname, '../../crates/lam-agent-core/target/debug/lam_agent_core.node')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          this.nativeBinding = require(p);
          this.loaded = true;
          console.log(`[NativeEngineBridge] Loaded Rust Core Engine from ${p}`);
          break;
        } catch (e) {
          console.warn(`[NativeEngineBridge] Failed loading ${p}:`, e);
        }
      }
    }
    return this.nativeBinding;
  }

  public static isLoaded(): boolean {
    this.getNative();
    return this.loaded;
  }
}
