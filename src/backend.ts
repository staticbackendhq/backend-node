import fetch from "node-fetch";
import FormData from "form-data";

export type Operator = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "!in";

export type Filter = [string, Operator, any];

export interface ListParam {
  page?: number;
  size?: number;
  descending?: boolean;
  desc?: boolean;
}

export interface BulkUpdate {
  update: any;
  clauses: Array<Array<any>>;
}

export interface Attachment {
  url?: string;
  body?: Buffer | string;
  contentType?: string;
  filename?: string;
}

export interface EmailData {
  fromName: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  replyTo: string;
  attachments?: Attachment[];
}

export interface ConvertData {
  toPDF: boolean;
  url: string;
  fullpage: boolean;
}

export interface SMSData {
  accountSID: string;
  authToken: string;
  toNumber: string;
  fromNumber: string;
  body: string;
}

export interface MagicLinkData {
  fromEmail: string;
  fromName: string;
  email: string;
  subject: string;
  body: string;
  link: string;
}

export interface AccountUser {
  id: string;
  userId: string;
  accountId: string;
  email: string;
  role: number;
  token: string;
}

export interface UserAccountEntry {
  accountId: string;
  role: number;
  home: boolean;
  token?: string;
}

export interface User {
  id: string;
  accountId: string;
  token: string;
  email: string;
  role: number;
  created: string;
}

export interface UploadedFile {
  id: string;
  url: string;
}

export interface FileUsage {
  bytes: number;
  gb: number;
}

export interface StoredFile {
  id: string;
  accountId: string;
  key: string;
  url: string;
  size: number;
  uploaded: string;
}

export interface StorageListParam {
  page?: number;
  sort?: "size";
}

export interface FileListResult {
  page: number;
  size: number;
  total: number;
  results: StoredFile[];
}

export interface RunHistory {
  id: string;
  functionId?: string;
  version: number;
  started: string;
  completed: string;
  success: boolean;
  output: string[];
}

export interface FunctionData {
  id?: string;
  accountId?: string;
  name: string;
  trigger: string;
  code: string;
  version?: number;
  lastUpdated?: string;
  lastRun?: string;
  history?: RunHistory[];
}

export class Backend {
  private baseURL: string = "https://na1.staticbackend.dev";
  private pubKey: string = "";

  constructor(key: string, region: string) {
    this.pubKey = key;

    if (region) {
      if (region == "dev") {
        this.baseURL = "http://localhost:8099";
      } else if (region.length > 3) {
        // for self-hosted base URL
        this.baseURL = region;
      } else {
        this.baseURL = `https://${region}.staticbackend.dev`;
      }
    }
  }

  private async rawreq(
    ct: string,
    token: string,
    method: string,
    path: string,
    body?: any,
  ) {
    try {
      let rawBody = null;
      if (body) {
        rawBody = ct == "application/json" ? JSON.stringify(body) : body;
      }

      let headers: Record<string, string> = {
        "SB-PUBLIC-KEY": this.pubKey,
      };

      if (ct) {
        headers["Content-Type"] = ct;
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const resp = await fetch(`${this.baseURL}${path}`, {
        method: method,
        headers: headers,
        body: rawBody,
      });

      var content: any = null;
      if (resp.status > 299) {
        content = await resp.text();
        return { ok: false, content: content };
      }

      const text = await resp.text();
      if (!text) {
        return { ok: true, content: true };
      }

      const contentType = resp.headers.get("content-type") || "";
      content = contentType.includes("application/json")
        ? JSON.parse(text)
        : text;
      return { ok: true, content: content };
    } catch (err) {
      console.log(err);
      return { ok: false, content: err };
    }
  }

  private async req(token: string, method: string, path: string, body?: any) {
    return await this.rawreq("application/json", token, method, path, body);
  }

  async register(email: string, pw: string, accountId?: string) {
    const body = { email: email, password: pw, accountId: accountId };
    return await this.req("", "POST", "/register", body);
  }

  async login(email: string, pw: string, accountId?: string) {
    const body = { email: email, password: pw, accountId: accountId };
    return await this.req("", "POST", "/login", body);
  }

  async emailExists(email: string) {
    const qs = new URLSearchParams({ e: email });
    return await this.req("", "GET", `/email?${qs.toString()}`);
  }

  async requestMagicLink(data: MagicLinkData) {
    return await this.req("", "POST", "/login/magic", data);
  }

  async loginWithMagicLink(email: string, code: string) {
    const qs = new URLSearchParams({ email: email, code: code });
    return await this.req("", "GET", `/login/magic?${qs.toString()}`);
  }

  async changePassword(
    token: string,
    email: string,
    oldPass: string,
    newPass: string,
  ) {
    const body = { email: email, oldPassword: oldPass, newPassword: newPass };
    return await this.req(token, "POST", "/user/changepw", body);
  }

  async getPasswordResetCode(rootToken: string, email: string) {
    const qs = new URLSearchParams({ e: email });
    const path = `/password/resetcode?${qs.toString()}`;
    return await this.req(rootToken, "GET", path);
  }

  async resetPassword(email: string, code: string, newPass: string) {
    const body = { email: email, code: code, password: newPass };
    return await this.req("", "POST", "/password/reset", body);
  }

  async sudoGetToken(rootToken: string, accountId: string) {
    return await this.req(
      rootToken,
      "GET",
      `/sudogettoken/${encodeURIComponent(accountId)}`,
    );
  }

  async sudoGetAuthTokenByUserID(
    rootToken: string,
    accountId: string,
    userId: string,
  ) {
    return await this.req(
      rootToken,
      "GET",
      `/sudogetauthtokenbyuserid/${encodeURIComponent(
        accountId,
      )}/${encodeURIComponent(userId)}`,
    );
  }

  async sudoGetUserByID(rootToken: string, accountId: string, userId: string) {
    return await this.req(
      rootToken,
      "GET",
      `/sudogetuserbyid/${encodeURIComponent(accountId)}/${encodeURIComponent(
        userId,
      )}`,
    );
  }

  async me(token: string) {
    return await this.req(token, "GET", "/me");
  }

  async changeEmail(token: string, email: string) {
    return await this.req(token, "POST", "/me/email", { email: email });
  }

  async setRole(token: string, email: string, role: number, accountId?: string) {
    const body = { email: email, role: role, accountId: accountId };
    return await this.req(token, "POST", "/setrole", body);
  }

  async addUser(token: string, email: string, password: string) {
    const body = { email: email, password: password };
    return await this.req(token, "POST", "/account/users", body);
  }

  async removeUser(token: string, userId: string) {
    return await this.req(token, "DELETE", `/account/users/${userId}`);
  }

  async users(token: string) {
    return await this.req(token, "GET", "/account/users");
  }

  async listAssociations(token: string) {
    return await this.req(token, "GET", "/account/associations");
  }

  async promoteUser(token: string) {
    return await this.req(token, "POST", "/account/promote");
  }

  async sudoGetUserAccounts(rootToken: string, email: string) {
    const qs = new URLSearchParams({ email: email });
    return await this.req(rootToken, "GET", `/account/user-accounts?${qs}`);
  }

  async cacheGet(rootToken: string, key: string) {
    const qs = new URLSearchParams({ key: key });
    return await this.req(rootToken, "GET", `/sudo/cache?${qs}`);
  }

  async cacheSet(rootToken: string, key: string, value: any) {
    const body = { key: key, value: JSON.stringify(value) };
    return await this.req(rootToken, "POST", "/sudo/cache", body);
  }

  async queueWork(rootToken: string, key: string, value: string) {
    const body = { key: key, value: value, type: "queue" };
    return await this.req(rootToken, "POST", "/sudo/cache", body);
  }

  async dequeueWork(rootToken: string, key: string) {
    const qs = new URLSearchParams({ type: "queue", key: key });
    return await this.req(rootToken, "GET", `/sudo/cache?${qs}`);
  }

  async create(token: string, repo: string, doc) {
    return await this.req(token, "POST", `/db/${repo}`, doc);
  }

  async createBulk(token: string, repo: string, docs: Array<any>) {
    return await this.req(token, "POST", `/db/${repo}?bulk=1`, docs);
  }

  async list(token: string, repo: string, param?: ListParam) {
    const qs = this.listParamToQuerystring(param);
    return await this.req(token, "GET", `/db/${repo}${qs}`);
  }

  async getById(token: string, repo: string, id: string) {
    return await this.req(token, "GET", `/db/${repo}/${id}`);
  }

  async getByIds(token: string, repo: string, ids: string[]) {
    return await this.req(token, "POST", `/db/${repo}?ids=true`, ids);
  }

  async query(
    token: string,
    repo: string,
    filters: Filter[],
    param?: ListParam,
  ) {
    const qs = this.listParamToQuerystring(param);
    return await this.req(token, "POST", `/query/${repo}${qs}`, filters);
  }

  async update(token: string, repo: string, id: string, doc) {
    return await this.req(token, "PUT", `/db/${repo}/${id}`, doc);
  }

  async updateBulk(token: string, repo: string, data: BulkUpdate) {
    return await this.req(token, "PUT", `/db/${repo}?bulk=1`, data);
  }

  async delete(token: string, repo: string, id: string) {
    return await this.req(token, "DELETE", `/db/${repo}/${id}`);
  }

  async deleteBulk(token: string, repo: string, filters: Filter[]) {
    const x = Buffer.from(JSON.stringify(filters)).toString("base64");
    return await this.req(token, "DELETE", `/db/${repo}?bulk=1&x=${x}`);
  }

  async count(token: string, repo: string, filters: Filter[]) {
    return await this.req(token, "POST", `/db/count/${repo}`, filters);
  }

  async search(token: string, repo: string, keywords: string) {
    const data = { col: repo, keywords: keywords };
    return await this.req(token, "POST", "/search", data);
  }

  async sudoList(rootToken: string, repo: string, param?: ListParam) {
    const qs = this.listParamToQuerystring(param);
    return await this.req(rootToken, "GET", `/sudo/${repo}${qs}`);
  }

  async sudoCreate(rootToken: string, repo: string, doc) {
    return await this.req(rootToken, "POST", `/sudo/${repo}`, doc);
  }

  async sudoCreateBulk(rootToken: string, repo: string, docs: Array<any>) {
    return await this.req(rootToken, "POST", `/sudo/${repo}?bulk=1`, docs);
  }

  async sudoGetById(rootToken: string, repo: string, id: string) {
    return await this.req(rootToken, "GET", `/sudo/${repo}/${id}`);
  }

  async sudoGetByIds(token: string, repo: string, ids: string[]) {
    return await this.req(token, "POST", `/sudo/${repo}?ids=true`, ids);
  }

  async sudoUpdate(rootToken: string, repo: string, id: string, doc) {
    return await this.req(rootToken, "PUT", `/sudo/${repo}/${id}`, doc);
  }

  async sudoUpdateBulk(rootToken: string, repo: string, data: BulkUpdate) {
    return await this.req(rootToken, "PUT", `/sudo/${repo}?bulk=1`, data);
  }

  async sudoQuery(
    rootToken: string,
    repo: string,
    filters: Filter[],
    param?: ListParam,
  ) {
    const qs = this.listParamToQuerystring(param);
    return await this.req(
      rootToken,
      "POST",
      `/sudoquery/${repo}${qs}`,
      filters,
    );
  }

  async sudoFind(
    rootToken: string,
    repo: string,
    filters: Filter[],
    param?: ListParam,
  ) {
    return await this.sudoQuery(rootToken, repo, filters, param);
  }

  async sudoDelete(rootToken: string, repo: string, id: string) {
    return await this.req(rootToken, "DELETE", `/sudo/${repo}/${id}`);
  }

  async sudoDeleteBulk(rootToken: string, repo: string, filters: Filter[]) {
    const x = Buffer.from(JSON.stringify(filters)).toString("base64");
    return await this.req(rootToken, "DELETE", `/sudo/${repo}?bulk=1&x=${x}`);
  }

  async sudoListRepositories(rootToken: string) {
    return await this.req(rootToken, "GET", "/sudolistall");
  }

  async increase(
    token: string,
    repo: string,
    id: string,
    field: string,
    n: number,
  ) {
    const body = { field: field, range: n };
    return await this.req(token, "PUT", `/inc/${repo}/${id}`, body);
  }

  async sudoAddIndex(
    rootToken: string,
    repo: string,
    field: string,
    type?: "text" | "number" | "boolean" | "date",
  ) {
    const params: Record<string, string> = { col: repo, field: field };
    if (type) {
      params.type = type;
    }
    const qs = `?${new URLSearchParams(params)}`;
    return await this.req(rootToken, "POST", `/sudo/index${qs}`, null);
  }

  async storeFile(token: string, buf: Buffer | ArrayBuffer, name?: string) {
    let fd = new FormData();
    fd.append("file", buf, {
      contentType: "application/octect-stream",
      filename: "file-upload",
    });
    if (name) {
      fd.append("name", name);
    }

    const ct = `multipart/form-data; boundary=${fd.getBoundary()}`;
    return await this.rawreq(ct, token, "POST", "/storage/upload", fd);
  }

  async storageUsage(token: string) {
    return await this.req(token, "GET", "/storage/usage");
  }

  async listFiles(token: string, param?: StorageListParam) {
    const qs = this.storageListParamToQuerystring(param);
    return await this.req(token, "GET", `/storage/files${qs}`);
  }

  async deleteFile(rootToken: string, id: string) {
    const qs = new URLSearchParams({ id: id });
    return await this.req(rootToken, "GET", `/sudostorage/delete?${qs}`);
  }

  async sendMail(rootToken: string, data: EmailData) {
    return await this.req(rootToken, "POST", "/sudo/sendmail", data);
  }

  async sendMailWithAttachments(rootToken: string, data: EmailData) {
    return await this.sendMail(rootToken, data);
  }

  async resizeImage(token: string, maxWidth: number, buf: ArrayBuffer) {
    let fd = new FormData();
    fd.append("file", buf, {
      contentType: "application/octect-stream",
      filename: "file-upload",
    });
    fd.append("width", maxWidth);

    const ct = `multipart/form-data; boundary=${fd.getBoundary()}`;
    return await this.rawreq(ct, token, "POST", "/extra/resizeimg", fd);
  }

  async convertURLToX(token: string, data: ConvertData) {
    return await this.req(token, "POST", "/extra/htmltox", data);
  }

  async publish(token: string, channel: string, type: string, data: any) {
    const payload = {
      channel: channel,
      type: type,
      data: typeof data == "string" ? data : JSON.stringify(data),
    };
    return await this.req(token, "POST", "/publish-message", payload);
  }

  async sudoSendSMS(rootToken: string, data: SMSData) {
    return await this.req(rootToken, "POST", "/extra/sms", data);
  }

  async listForm(rootToken: string, name?: string) {
    const qs = new URLSearchParams();
    if (name) {
      qs.set("name", name);
    }
    const query = qs.toString();
    return await this.req(rootToken, "GET", `/form${query ? `?${query}` : ""}`);
  }

  async addFunction(rootToken: string, fn: FunctionData) {
    return await this.req(rootToken, "POST", "/fn/add", fn);
  }

  async listFunctions(rootToken: string) {
    return await this.req(rootToken, "GET", "/fn");
  }

  async updateFunction(rootToken: string, fn: FunctionData) {
    return await this.req(rootToken, "POST", "/fn/update", fn);
  }

  async deleteFunction(rootToken: string, name: string) {
    return await this.req(
      rootToken,
      "GET",
      `/fn/del/${encodeURIComponent(name)}`,
    );
  }

  async functionInfo(rootToken: string, name: string) {
    return await this.req(
      rootToken,
      "GET",
      `/fn/info/${encodeURIComponent(name)}`,
    );
  }

  async execFunction(token: string, name: string, data?: any) {
    return await this.req(
      token,
      "POST",
      `/fn/exec/${encodeURIComponent(name)}`,
      data,
    );
  }

  async sudoExecFunction(rootToken: string, name: string, data?: any) {
    return await this.req(
      rootToken,
      "POST",
      `/fn/sudoexec/${encodeURIComponent(name)}`,
      data,
    );
  }

  private listParamToQuerystring(param?: ListParam): string {
    const qs = new URLSearchParams();
    if (!param) {
      return "";
    }
    if (param.page && param.page > 0) {
      qs.set("page", param.page.toString());
    }
    if (param.size && param.size > 0) {
      qs.set("size", param.size.toString());
    }
    if (param.descending || param.desc) {
      qs.set("desc", "true");
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
  }

  private storageListParamToQuerystring(param?: StorageListParam): string {
    const qs = new URLSearchParams();
    if (!param) {
      return "";
    }
    if (param.page && param.page > 0) {
      qs.set("page", param.page.toString());
    }
    if (param.sort) {
      qs.set("sort", param.sort);
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
  }
}
