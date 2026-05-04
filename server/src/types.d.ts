declare module 'rss-parser' {
    export default class Parser {
        parseURL(url: string): Promise<any>;
    }
}

declare module 'xml2js' {
    export function parseStringPromise(xml: string): Promise<any>;
}

declare module 'he' {
    export function decode(html: string): string;
    export function encode(text: string): string;
}
