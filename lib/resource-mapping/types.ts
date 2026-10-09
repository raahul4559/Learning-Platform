import { ResourceType } from "@prisma/client";

/** The unit a resource's internal structure is divided into (a video index, a chapter, a page, ...). */
export type SectionUnit = "video" | "chapter" | "module" | "page" | "timestamp";

/** One roadmap topic's slice of a resource — e.g. "Arrays -> Videos 4-8". */
export type TopicSection = {
  topicSlug: string;
  topicTitle: string;
  label: string;
  unit: SectionUnit;
  startIndex: number;
  endIndex: number;
};

/** What a caller submits to have a resource mapped: a title/URL, nothing more. */
export type ResourceMappingRequest = {
  title: string;
  url: string;
  type?: ResourceType;
};

export type ResolvedResource = {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  provider?: string;
};

export type ResourceMapping = {
  resource: ResolvedResource;
  sections: TopicSection[];
  /** Which provider produced this mapping, e.g. "seeded-catalog". Surfaced for debugging/telemetry. */
  source: string;
};

/**
 * A pluggable source of resource -> topic mappings. `resolve` returns null when
 * this provider has no opinion on the submitted resource, so the pipeline can
 * fall through to the next one. Implementations are expected to be read-only
 * and side-effect-free with respect to the request itself (any persistence
 * happens in the caller, e.g. app/api/resources/route.ts).
 */
export interface ResourceMappingProvider {
  id: string;
  label: string;
  resolve(request: ResourceMappingRequest): Promise<ResourceMapping | null>;
}
