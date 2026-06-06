declare module "next/navigation" {
  export function redirect(url: string): never;
  export function useRouter(): {
    push(href: string): void;
    refresh(): void;
  };
}

declare module "next/headers" {
  export function cookies(): Promise<{
    get(name: string): { value: string } | undefined;
    set(
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean;
        sameSite?: "lax" | "strict" | "none";
        secure?: boolean;
        path?: string;
        maxAge?: number;
      }
    ): void;
    delete(name: string): void;
  }>;
}
