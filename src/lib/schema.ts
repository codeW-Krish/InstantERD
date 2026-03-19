import { z } from 'zod';
import type { ERDSchema } from './types';

const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  isWeak: z.boolean(),
  ownerId: z.string().optional(),
});

const ParticipantSchema = z.object({
  entityId: z.string(),
  cardinality: z.enum(['1', 'N', 'M']),
  participation: z.enum(['total', 'partial']),
  role: z.string().optional(),
});

const RelationshipAttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['simple', 'multivalued', 'derived']),
});

const RelationshipSchema = z.object({
  id: z.string(),
  name: z.string(),
  isIdentifying: z.boolean(),
  participants: z.array(ParticipantSchema),
  attributes: z.array(RelationshipAttributeSchema),
});

const ChildAttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const AttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string(),
  parentType: z.literal('entity'),
  type: z.enum(['key', 'partialKey', 'simple', 'multivalued', 'derived', 'composite']),
  childAttributes: z.array(ChildAttributeSchema).optional(),
});

const DiagramMetaSchema = z.object({
  title: z.string(),
  entityCount: z.number(),
  relationshipCount: z.number(),
  notes: z.string().optional(),
});

export const ERDJSONSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
  attributes: z.array(AttributeSchema),
  meta: DiagramMetaSchema,
});

export function parseERDSchema(raw: unknown): ERDSchema {
  const schema = ERDJSONSchema.parse(raw) as ERDSchema;

  // Validate business rules
  for (const entity of schema.entities) {
    if (entity.isWeak) {
      if (!entity.ownerId) {
        throw new Error(`Weak entity ${entity.id} (${entity.name}) must have an ownerId`);
      }
      const hasIdentifyingRel = schema.relationships.some(
        (r) => r.isIdentifying && r.participants.some((p) => p.entityId === entity.id)
      );
      if (!hasIdentifyingRel) {
        throw new Error(`Weak entity ${entity.id} (${entity.name}) has no identifying relationship`);
      }
    }
  }

  for (const rel of schema.relationships) {
    if (rel.participants.length < 2 || rel.participants.length > 3) {
      throw new Error(`Relationship ${rel.id} (${rel.name}) must have exactly 2 or 3 participants`);
    }
  }

  for (const attr of schema.attributes) {
    if (attr.type === 'partialKey') {
      const parentEntity = schema.entities.find((e) => e.id === attr.parentId);
      if (!parentEntity || !parentEntity.isWeak) {
        throw new Error(`Partial key attribute ${attr.id} must belong to a weak entity`);
      }
    }
  }

  return schema;
}
