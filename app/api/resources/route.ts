import { ResourceType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveResourceMapping } from "@/lib/resource-mapping/resolve";

function slugify(value: string) {
  const base = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "").slice(0, 80);
  return base ? `${base}-${Date.now()}` : `resource-${Date.now()}`;
}

/** Preview the mapping a title/URL would resolve to, without persisting anything. */
export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  const url = request.nextUrl.searchParams.get("url");
  if (!title || !url) return NextResponse.json({ error: "title and url are required" }, { status: 400 });
  try {
    const mapping = await resolveResourceMapping({ title, url });
    return NextResponse.json({ mapping });
  } catch (error) { console.error("GET /api/resources failed", error); return NextResponse.json({ error: "Resource mapping is unavailable" }, { status: 503 }); }
}

/** Attach a resource to the roadmap. A known seeded resource maps across every topic it was curated for; an unknown one attaches to the given topicId as a plain custom resource. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { title?: string; url?: string; type?: string; topicId?: string } | null;
  if (!body?.title || !body.url) return NextResponse.json({ error: "title and url are required" }, { status: 400 });
  const type = (Object.values(ResourceType) as string[]).includes(body.type ?? "") ? (body.type as ResourceType) : ResourceType.ARTICLE;
  try {
    const mapping = await resolveResourceMapping({ title: body.title, url: body.url, type });
    if (mapping) return NextResponse.json({ resource: mapping.resource, sections: mapping.sections, source: mapping.source });

    if (!body.topicId) return NextResponse.json({ error: "topicId is required to attach a resource without a known topic mapping" }, { status: 400 });
    const topic = await prisma.topic.findUnique({ where: { id: body.topicId } });
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    const resource = await prisma.resource.create({ data: { slug: slugify(body.title), title: body.title, type, url: body.url, isDemo: false, provider: "User submitted" } });
    const position = (await prisma.resourceTopic.count({ where: { topicId: topic.id } })) + 1;
    await prisma.resourceTopic.create({ data: { resourceId: resource.id, topicId: topic.id, position, sectionMetadata: { label: "Custom resource" } } });

    return NextResponse.json({
      resource: { id: resource.id, title: resource.title, url: resource.url, type: resource.type },
      sections: [{ topicSlug: topic.slug, topicTitle: topic.title, label: "Custom resource", unit: "module", startIndex: 0, endIndex: 0 }],
      source: "custom",
    });
  } catch (error) { console.error("POST /api/resources failed", error); return NextResponse.json({ error: "Resource mapping is unavailable" }, { status: 503 }); }
}
