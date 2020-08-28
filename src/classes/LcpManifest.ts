
export interface LcpManifest{
  name: string,
  author: string,
  description: string, // v-html
  item_prefix?: string | null,
  version: string,
  image_url?: string | null, // .jpg or .png preferred
  website?: string | null // url
}
