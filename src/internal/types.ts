import { statusText, StatusNotFound } from "./http"
// Content-Type MIME of the most common data formats.
export const MIMEJSON = "application/json"
export const MIMEHTML = "text/html"
export const MIMEXML = "application/xml"
export const MIMEXML2 = "text/xml"
export const MIMEPlain = "text/plain"
export const MIMEPOSTForm = "application/x-www-form-urlencoded"
export const MIMEMultipartPOSTForm = "multipart/form-data"
export const MIMEPROTOBUF = "application/x-protobuf"
export const MIMEMSGPACK = "application/x-msgpack"
export const MIMEMSGPACK2 = "application/msgpack"
export const MIMEYAML = "application/x-yaml"
export const MIMEYAML2 = "application/yaml"
export const MIMETOML = "application/toml"
export const DefaultOffered = [
    MIMEJSON,
    MIMEPlain,
]
export class HandleContext {
    constructor(readonly url: URL,
        readonly request: Request<unknown, IncomingRequestCfProperties<unknown>>,
        readonly env: Env,
        readonly ctx: ExecutionContext) {
    }
    notfound(): Promise<Response> {
        return Promise.resolve(new Response(`not found: ${this.url.pathname}`, {
            status: StatusNotFound,
            statusText: statusText(StatusNotFound),
        }))
    }
    negotiate(o: any, ...offered: Array<string>): Promise<Response> {
        return this.negotiateStatus(200, o, ...offered)
    }
    json(status: number, o: any): Promise<Response> {
        return Promise.resolve(new Response(JSON.stringify(o), {
            status: status,
            statusText: statusText(status),
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }))
    }
    text(status: number, o: any): Promise<Response> {
        return Promise.resolve(new Response(`${o}`, {
            status: status,
            statusText: statusText(status),
            headers: {
                "Content-Type": "text/plain; charset=utf-8"
            }
        }))
    }
    negotiateStatus(status: number, o: any, ...offered: Array<string>): Promise<Response> {
        offered = offered.length == 0 ? DefaultOffered : offered
        switch (this.negotiateFormat(offered) ?? offered[0]) {
            case MIMEJSON:
                return this.json(status, o)
            case MIMEPlain:
                return this.text(status, o)
        }
        // return default
        return Promise.resolve(new Response(JSON.stringify(o), {
            status: status,
            statusText: statusText(status),
        }))
    }

    private accepted_?: Array<string>
    /**
     * 返回協商的客戶端接受的數據格式
     */
    negotiateFormat(offered: Array<string>): string | undefined {
        if (offered.length == 0) {
            return
        }
        let accepted = this.accepted_
        if (!accepted) {
            // const s = this.request.headers.getAll("Accept") // 目前只能 getAll("set-cookie") 
            const s = this.request.headers.get("Accept")
            accepted = typeof s === "string" ? [s] : []
            this.accepted_ = accepted
        }
        if (accepted.length == 0) {
            return offered[0]
        }
        console.log(accepted)
        let i: number
        for (const acc of accepted) {
            for (const offer of offered) {
                // According to RFC 2616 and RFC 2396, non-ASCII characters are not allowed in headers,
                // therefore we can just iterate over the string without casting it into []rune
                i = 0
                for (; i < acc.length && i < offer.length; i++) {
                    if (acc[i] == '*' || offer[i] == '*') {
                        return offer
                    }
                    if (acc[i] != offer[i]) {
                        break
                    }
                }
                if (i == acc.length) {
                    return offer
                }
            }
        }
    }
}
export type HandleFunc = (ctx: HandleContext) => Promise<Response> | undefined
