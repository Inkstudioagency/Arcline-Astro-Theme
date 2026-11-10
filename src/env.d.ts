interface ImportMetaEnv {
  readonly STRAPI_URL?: string;
  readonly STRAPI_API_TOKEN?: string;
  readonly SITE_URL?: string;
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
