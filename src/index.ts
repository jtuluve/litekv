const API_URL = "https://litekv-api.onrender.com";

export class KVStore {
  private appExists: boolean;
  private checked: boolean;
  private cache: Map<string, string>;
  shouldCache: boolean;
  appId: string;
  API_URL: string;

  constructor(
    appId: string,
    {
      api_url = API_URL,
      shouldCache = false,
    }: { api_url?: string; shouldCache?: boolean } = {}
  ) {
    this.appExists = false;
    this.checked = false;
    this.cache = new Map();
    this.shouldCache = shouldCache;
    this.appId = appId;
    this.API_URL = api_url;
  }

  async set(key: string, value: string): Promise<boolean> {
    await this.checkAppExists();
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(value);
    const res = await this.fetch(
      `setVal/${this.appId}/${encodedKey}/${encodedValue}`
    );
    if (res === "true") {
      if (this.shouldCache) this.cache.set(key, value);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | undefined> {
    await this.checkAppExists();
    if (this.shouldCache && this.cache.has(key)) {
      return this.cache.get(key);
    }

    const encodedKey = encodeURIComponent(key);
    const res = await this.fetch(`getVal/${this.appId}/${encodedKey}`);
    if (res && res !== "null" && res !== "undefined") {
      const decodedRes = decodeURIComponent(res);
      if (this.shouldCache) {
        this.cache.set(key, decodedRes);
      }
      return decodedRes;
    }
    return undefined;
  }

  async delete(key: string): Promise<boolean> {
    await this.checkAppExists();
    if (this.shouldCache) {
      this.cache.delete(key);
    }
    const encodedKey = encodeURIComponent(key);
    const res = await this.fetch(`setVal/${this.appId}/${encodedKey}`);
    return res === "true";
  }

  async inc(key: string, incBy: number = 1): Promise<boolean> {
    await this.checkAppExists();
    const encodedKey = encodeURIComponent(key);
    const res = await this.fetch(`inc/${this.appId}/${encodedKey}/${incBy}`);
    if (res === "true" && this.shouldCache) {
      const currentVal = await this.get(key);
      if (currentVal !== undefined) {
        const newVal = (parseInt(currentVal) + incBy).toString();
        this.cache.set(key, newVal);
      }
    }
    return res === "true";
  }

  async dec(key: string, decBy: number = 1): Promise<boolean> {
    await this.checkAppExists();
    const encodedKey = encodeURIComponent(key);
    const res = await this.fetch(`dec/${this.appId}/${encodedKey}/${decBy}`);
    if (res === "true" && this.shouldCache) {
      // Update cache if decrement was successful
      const currentVal = await this.get(key);
      if (currentVal !== undefined) {
        const newVal = (parseInt(currentVal) - decBy).toString();
        this.cache.set(key, newVal);
      }
    }
    return res === "true";
  }

  async checkAppExists(): Promise<void> {
    if (this.checked) return;
    try {
      const res = await this.fetch(`exists/${this.appId}`);
      this.appExists = res === "true";
      this.checked = true;
      if (!this.appExists) {
        throw new Error(`App with ID '${this.appId}' does not exist`);
      }
    } catch (error) {
      this.checked = true;
      throw new Error(
        `Failed to check app existence: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async fetch(path: string): Promise<string> {
    try {
      const response = await fetch(`${this.API_URL}/${path}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(
        `Fetch failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export default KVStore;
