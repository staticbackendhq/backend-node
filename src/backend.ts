import * as fetch from "node-fetch";
import * as formData from "form-data";

export interface ListParam {
	page: number;
	size: number;
	descending: boolean;
}

export interface BulkUpdate {
	update: any;
	clauses: Array<Array<any>>;
}

export interface EmailData {
	fromName: string;
	from: string;
	to: string;
	subject: string;
	body: string;
	replyTo: string;
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

export class Backend {
	private baseURL: string = "https://na1.staticbackend.com";
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
				this.baseURL = `https://${region}.staticbackend.com`;
			}
		}
	}

	private async rawreq(ct: string, token: string, method: string, path: string, body?: any) {
		try {
			let rawBody = null;
			if (body) {
				rawBody = ct == "application/json" ? JSON.stringify(body) : body;
			}

			let headers = {
				"Content-Type": ct,
				"SB-PUBLIC-KEY": this.pubKey
			};

			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const resp = await fetch(`${this.baseURL}${path}`, {
				method: method,
				headers: headers,
				body: rawBody
			});

			var content: any = null;
			if (resp.status > 299) {
				content = await resp.text();
				return { ok: false, content: content };
			}

			content = await resp.json();
			return { ok: true, content: content };
		} catch (err) {
			console.log(err);
			return { ok: false, content: err };
		}
	}

	private async req(token: string, method: string, path: string, body?: any) {
		return await this.rawreq("application/json", token, method, path, body);
	}

	async register(email: string, pw: string) {
		const body = { email: email, password: pw };
		return await this.req("", "POST", "/register", body);
	}

	async login(email: string, pw: string) {
		const body = { email: email, password: pw };
		return await this.req("", "POST", "/login", body);
	}

	async changePassword(token: string, email: string, oldPass: string, newPass: string) {
		const body = { email: email, oldPassword: oldPass, newPassword: newPass};
		return await this.req(token, "POST", "/user/changepw", body);
	}

	async getPasswordResetCode(rootToken: string, email: string) {
		const path = `/password/resetcode?${encodeURIComponent(email)}`;
		return await this.req(rootToken, "GET", path);
	}

	async resetPassword(email: string, code: string, newPass: string) {
		const body = {email: email, code: code, password: newPass};
		return await this.req("", "POST", "/password/reset", body);
	}

	async sudoGetToken(rootToken: string, accountId: string) {
		return await this.req(rootToken, "GET", `/sudogettoken/${accountId}`);
	}

	async me(token: string) {
		return await this.req(token, "GET", "/me");
	}

	async cacheGet(rootToken: string, key: string) {
		return await this.req(rootToken, "GET", `/sudo/cache?key=${key}`);
	}

	async cacheSet(rootToken: string, key: string, value: any) {
		const body = {key: key, value: JSON.stringify(value)};
		return await this.req(rootToken, "POST", "/sudo/cache", body);
	}

	async create(token: string, repo: string, doc) {
		return await this.req(token, "POST", `/db/${repo}`, doc)
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

	async query(token: string, repo: string, filters, param?: ListParam) {
		const qs = this.listParamToQuerystring(param);
		return await this.req(token, "POST", `/query/${repo}${qs}`, filters);
	}

	async update(token: string, repo: string, id: string, doc) {
		return await this.req(token, "PUT", `/db/${repo}/${id}`, doc)
	}

	async updateBulk(token: string, repo: string, data: BulkUpdate) {
		return await this.req(token, "PUT", `/db/${repo}?bulk=1`, data);
	}

	async delete(token: string, repo: string, id: string) {
		return await this.req(token, "DELETE", `/db/${repo}/${id}`);
	}

	async count(token: string, repo: string, filters) {
		return await this.req(token, "POST", `/db/count/${repo}`, filters);
	}

	async sudoList(rootToken: string, repo: string, param?: ListParam) {
		const qs = this.listParamToQuerystring(param);
		return await this.req(rootToken, "GET", `/sudo/${repo}${qs}`);
	}

	async sudoGetById(rootToken: string, repo: string, id: string) {
		return await this.req(rootToken, "GET", `/sudo/${repo}/${id}`);
	}

	async sudoUpdate(rootToken: string, repo: string, id: string, doc) {
		return await this.req(rootToken, "PUT", `/sudo/${repo}/${id}`, doc);
	}

	async sudoQuery(rootToken: string, repo: string, filters, param?: ListParam) {
		const qs = this.listParamToQuerystring(param);
		return await this.req(rootToken, "POST", `/sudoquery/${repo}${qs}`, filters);
	}

	async increase(token: string, repo: string, id: string, field: string, n: number) {
		const body = {field: field, range: n};
		return await this.req(token, "PUT", `/inc/${repo}/${id}`, body);
	}

	async sudoAddIndex(rootToken: string, repo: string, field: string) {
		const qs = `?col=${repo}&field=${field}`;
		return await this.req(rootToken, "POST", `/sudo/index${qs}`, null);
	}

	async storeFile(token: string, buf: ArrayBuffer) {
		let fd = new formData();
		fd.append("file", buf, {
			contentType: "application/octect-stream",
			filename: "file-upload"
		});

		const ct = `multipart/form-data; boundary=${fd.getBoundary()}`;
		return await this.rawreq(ct, token, "POST", "/storage/upload", fd);
	}

	async deleteFile(token: string, id: string) {
		return await this.req(token, "GET", `/sudostorage/delete?id=${id}`);
	}

	async sendMail(rootToken: string, data: EmailData) {
		return await this.req(rootToken, "POST", "/sudo/sendmail", data);
	}

	async resizeImage(token: string, maxWidth: number, buf: ArrayBuffer) {
		let fd = new formData();
		fd.append("file", buf, {
			contentType: "application/octect-stream",
			filename: "file-upload"
		});
		fd.append("width", maxWidth);

		const ct = `multipart/form-data; boundary=${fd.getBoundary()}`;
		return await this.rawreq(ct, token, "POST", "/extra/resizeimg", fd);
	}

	async convertURLToX(token: string, data: ConvertData) {
		return await this.req(token, "POST", "/extra/htmltox", data);
	}

	async sudoSendSMS(rootToken: string, data: SMSData) {
		return await this.req(rootToken, "POST", "/extra/sms", data);
	}

	private listParamToQuerystring(param?: ListParam): string {
		var qs = "";
		if (param) {
			qs = `?page=${param.page}&size=${param.size}`;
			if (param.descending) {
				qs += "&desc=true";
			}
		}
		return qs;
	}
}