import { prisma } from "@/lib/prisma";
import { ResourceMapping, ResourceMappingProvider, TopicSection } from "./types";

type SectionMetadata = Partial<Pick<TopicSection, "label" | "unit" | "startIndex" | "endIndex">>;

/**
 * The only provider with real data behind it for this MVP. It resolves a
 * submitted title/URL against resources already curated into the catalog
 * (seeded via prisma/seed.js) and returns the topic sections curated ahead of
 * time for it — e.g. "Java DSA Complete Course" -> Arrays: videos 4-8. No
 * scraping and no outbound network calls: everything comes from Postgres.
 */
export const seededCatalogProvider: ResourceMappingProvider = {
  id: "seeded-catalog",
  label: "Seeded resource catalog",
  async resolve(request) {
    const resource = await prisma.resource.findFirst({
      where: { OR: [{ url: request.url }, { title: { equals: request.title, mode: "insensitive" } }] },
      include: { topics: { orderBy: { position: "asc" }, include: { topic: true } } },
    });
    if (!resource || !resource.topics.length) return null;

    const sections: TopicSection[] = resource.topics.map((entry) => {
      const metadata = (entry.sectionMetadata ?? {}) as SectionMetadata;
      return {
        topicSlug: entry.topic.slug,
        topicTitle: entry.topic.title,
        label: metadata.label ?? entry.topic.title,
        unit: metadata.unit ?? "module",
        startIndex: metadata.startIndex ?? 0,
        endIndex: metadata.endIndex ?? 0,
      };
    });

    const mapping: ResourceMapping = {
      resource: { id: resource.id, title: resource.title, url: resource.url, type: resource.type, provider: resource.provider ?? undefined },
      sections,
      source: "seeded-catalog",
    };
    return mapping;
  },
};

/**
 * Not implemented yet. Planned: call the YouTube Data API's
 * `playlistItems.list` for a submitted playlist URL to pull every video's
 * title, position, and duration, then group contiguous runs of videos under
 * the topic they teach — initially via per-video title keyword matching,
 * later by handing titles/descriptions to `automaticTopicExtractor` below.
 */
export const youtubePlaylistProvider: ResourceMappingProvider = {
  id: "youtube-playlist",
  label: "YouTube playlist ingestion (planned)",
  async resolve() {
    return null;
  },
};

/**
 * Not implemented yet. Planned: fetch a course platform's public
 * syllabus/curriculum (e.g. a Udemy or Coursera section list) and map each
 * section/lecture range to a topic, the same shape the seeded catalog
 * produces today.
 */
export const courseIngestionProvider: ResourceMappingProvider = {
  id: "course-ingestion",
  label: "Course syllabus ingestion (planned)",
  async resolve() {
    return null;
  },
};

/**
 * Not implemented yet. Planned fallback for resources with no structured
 * syllabus (a raw transcript, an article, a blog series): classify the
 * content against the DSA topic catalog — e.g. embeddings + nearest-topic
 * match, or an LLM classifier — to propose a mapping for a human to confirm,
 * rather than requiring one to exist up front.
 */
export interface AutomaticTopicExtractor {
  classify(content: string): Promise<{ topicSlug: string; confidence: number }[]>;
}
export const automaticTopicExtractor: AutomaticTopicExtractor = {
  async classify() {
    return [];
  },
};
