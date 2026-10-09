import { courseIngestionProvider, seededCatalogProvider, youtubePlaylistProvider } from "./providers";
import { ResourceMapping, ResourceMappingProvider, ResourceMappingRequest } from "./types";

/**
 * Ordered resolution pipeline: the first provider with an opinion wins. Real
 * ingestion providers (YouTube API, course platforms, automatic extraction)
 * slot in here ahead of or alongside the seeded catalog as they're built —
 * callers never need to change.
 */
const providers: ResourceMappingProvider[] = [seededCatalogProvider, youtubePlaylistProvider, courseIngestionProvider];

export async function resolveResourceMapping(request: ResourceMappingRequest): Promise<ResourceMapping | null> {
  for (const provider of providers) {
    const mapping = await provider.resolve(request);
    if (mapping) return mapping;
  }
  return null;
}
