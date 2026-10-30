export class ApiError extends Error {
  status:number
  constructor(message:string,status:number) { super(message); this.status = status }
}
export async function api<T>(path:string,init:RequestInit = {}):Promise<T> {
  const response = await fetch(path,{ ...init,credentials:'same-origin',headers:init.body instanceof FormData ? init.headers : { 'Content-Type':'application/json',...init.headers } })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(body?.error || `请求失败（${response.status}），请重试。`,response.status)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}
