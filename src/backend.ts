import * as fetch from "node-fetch";
import * as formData from "form-data";

export class Backend {
	private baseURL: string = "https://na1.staticbackend.com";
	private pubKey: string = "";

	constructor(key: string, region: string) {
		this.pubKey = key;

		if (region) {
			if (region == "dev") {
				this.baseURL = "http://localhost:8099";
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

	async create(token: string, repo: string, doc) {
		return await this.req(token, "POST", `/db/${repo}`, doc)
	}

	async list(token: string, repo: string) {
		return await this.req(token, "GET", `/db/${repo}`);
	}

	async getById(token: string, repo: string, id: string) {
		return await this.req(token, "GET", `/db/${repo}/${id}`);
	}

	async query(token: string, repo: string, filters) {
		return await this.req(token, "POST", `/query/${repo}`, filters);
	}

	async update(token: string, repo: string, id: string, doc) {
		return await this.req(token, "PUT", `/db/${repo}/${id}`, doc)
	}

	async delete(token: string, repo: string, id: string) {
		return await this.req(token, "DELETE", `/db/${repo}/${id}`);
	}

	async sudoUpdate(adminToken: string, repo: string, id: string, doc) {
		return await this.req(adminToken, "PUT", `/sudo/${repo}/${id}`, doc);
	}

	async storeFile(token: string, size: number, buf: ArrayBuffer) {
		let fd = new formData();
		fd.append("file", buf, {
			contentType: "application/octect-stream",
			filename: "file-upload"
		});

		const ct = `multipart/form-data; boundary=${fd.getBoundary()}`;
		return await this.rawreq(ct, token, "POST", "/storage/upload", fd);
	}
}