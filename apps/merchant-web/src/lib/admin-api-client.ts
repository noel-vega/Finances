import { AdminClient } from "merchant-sdk";

export const adminApi = new AdminClient(
  import.meta.env.VITE_SHOP_ADMIN_API_BASE_URL,
);

// type Path = URL | string;

// export const RefreshTokenResponse = z.object({ access_token: z.string() });

// export class AdminApiClient {
//   private readonly baseURL: string;
//   private accessToken: string | undefined;

//   constructor(baseURL: string) {
//     this.baseURL = baseURL;
//   }

//   private async do(path: Path, init?: RequestInit) {
//     const url = new URL(path, this.baseURL);
//     const response = await fetch(url, {
//       credentials: "include",
//       ...init,
//     });

//     if (response.status === 401) {
//       await this.refreshAccessToken();
//     }
//     return await fetch(url, init);
//   }

//   async refreshAccessToken() {
//     const url = new URL("/auth/token/refresh", this.baseURL);
//     const response = await fetch(url, {
//       method: "GET",
//       credentials: "include",
//       headers: {
//         "content-type": "application/json",
//       },
//     });
//     if (!response.ok) {
//       return { success: false };
//     }
//     const json = await response.json();
//     const data = RefreshTokenResponse.parse(json);
//     this.accessToken = data.access_token;
//     return { success: true };
//   }

//   public async signIn(data: SignInRequestBody) {
//     console.log(this.baseURL);
//     const url = new URL("/auth/signin", this.baseURL);
//     const res = await fetch(url, {
//       method: "POST",
//       credentials: "include",
//       body: JSON.stringify(data),
//       headers: {
//         "content-type": "application/json",
//       },
//     });

//     if (!res.ok) {
//       switch (res.status) {
//         case 401:
//           throw new AuthenticationError();
//         case 500:
//           throw new InternalServerError();
//       }
//     }
//     const json = await res.json();

//     const parseResult = SignInResponseSchema.safeParse(json);

//     if (!parseResult.success) {
//       throw new ResponseSchemaError(parseResult.error);
//     }
//     console.log("SIGN IN:", json);
//     this.accessToken = json.access_token;
//   }

//   get(path: Path, init?: RequestInit) {
//     return this.do(new URL(path, this.baseURL), {
//       method: "GET",
//       ...init,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${this.accessToken}`,
//         ...init?.headers,
//       },
//     });
//   }

//   post(path: Path, init?: RequestInit) {
//     return this.do(new URL(path, this.baseURL), {
//       method: "POST",
//       ...init,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${this.accessToken}`,
//         ...init?.headers,
//       },
//     });
//   }

// }

// export const adminApi = new AdminApiClient(
//   import.meta.env.VITE_SHOP_ADMIN_API_BASE_URL,
// );
