const getNow = () => {
    const now = new Date()
    return `${now.getFullYear().toString().padStart(4, "0")}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`
}

export const hashPlugin = function (opt?: { type?: "date" | "random" }) {

    const { type } = opt || { type: "date" }
    let hash: string
    if (type === "random") {
        hash = Math.random().toString(36).slice(2, 9)
    } else if (type === "date") {
        hash = getNow()
    } else {
        hash = getNow()
    }

    return {
        name: "script-hash",
        transformIndexHtml: {
            hook: "post",
            handler: function (html, ctx) {
                if (ctx.server) {
                    return html
                }
                return html
                    .replace(/<script(.*?)src="(.*?)">/g, `<script$1src="$2?${hash}">`,)
                    .replace(/<link rel="stylesheet"(.*?)href="(.*?)">/g, `<link rel="stylesheet"$1href="$2?${hash}">`,)
            },
        }
    };
};