/**
 * WebSocket client for the real-time feed.
 * Authenticates via ?token= query param.
 * Reconnects automatically on disconnect.
 */

type Handler = (msg: Record<string, unknown>) => void;

class FeedSocket {
  private ws: WebSocket | null = null;
  private handlers: Set<Handler> = new Set();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;
  private intentionalClose = false;

  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.token === token) return;
    this.token = token;
    this.intentionalClose = false;
    this._open();
  }

  private _open(): void {
    if (!this.token) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = '8000'; // backend port
    const url = `${protocol}://${host}:${port}/ws/feed?token=${encodeURIComponent(this.token)}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // Keepalive ping every 25s
      this.pingTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('ping');
        }
      }, 25_000);
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        for (const h of this.handlers) h(data);
      } catch {
        // ignore malformed
      }
    };

    this.ws.onclose = () => {
      this._clearTimers();
      if (!this.intentionalClose) {
        // Auto-reconnect after 3s
        this.reconnectTimer = setTimeout(() => this._open(), 3_000);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._clearTimers();
    this.ws?.close();
    this.ws = null;
    this.token = null;
  }

  private _clearTimers(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  onMessage(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const feedSocket = new FeedSocket();
