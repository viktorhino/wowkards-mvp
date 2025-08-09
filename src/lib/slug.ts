import slugify from "slugify";

export const suggestSlug = (name: string, last: string) =>
  slugify(`${name}${last}`, { lower: true, strict: true });
