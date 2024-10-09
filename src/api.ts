import { HandleFunc, HandleContext, MIMEJSON, MIMEPlain } from './internal/types'
const basicHandler: Record<string, HandleFunc> = {
    '/api/ip/connecting': (ctx) => ctx.negotiate(ctx.request.headers.get('cf-connecting-ip') ?? '', MIMEPlain, MIMEJSON),
    '/api/ip/real': (ctx) => ctx.negotiate(ctx.request.headers.get('x-real-ip') ?? '', MIMEPlain, MIMEJSON),
}

export function apiFetch(ctx: HandleContext): Promise<Response> {
    const handle = basicHandler[ctx.url.pathname]
    if (handle) {
        const ret = handle(ctx)
        if (ret) {
            return ret
        }
    }
    return ctx.notfound()
}