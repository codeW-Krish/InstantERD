export type InputMode = 'nl' | 'sql' | 'mix';

export type AttributeType =
  | 'key'
  | 'partialKey'
  | 'simple'
  | 'multivalued'
  | 'derived'
  | 'composite';

export interface Entity {
  id: string;           // "E1", "E2", etc.
  name: string;         // PascalCase singular noun
  isWeak: boolean;
  ownerId?: string;     // required if isWeak: true
}

export interface Participant {
  entityId: string;
  cardinality: '1' | 'N' | 'M';
  participation: 'total' | 'partial';
  role?: string;
}

export interface RelationshipAttribute {
  id: string;
  name: string;
  type: 'simple' | 'multivalued' | 'derived';
}

export interface Relationship {
  id: string;
  name: string;
  isIdentifying: boolean;
  participants: Participant[];
  attributes: RelationshipAttribute[];
}

export interface ChildAttribute {
  id: string;
  name: string;
}

export interface Attribute {
  id: string;
  name: string;
  parentId: string;
  parentType: 'entity';
  type: AttributeType;
  childAttributes?: ChildAttribute[];
}

export interface DiagramMeta {
  title: string;
  entityCount: number;
  relationshipCount: number;
  notes?: string;
}

export interface ERDSchema {
  entities: Entity[];
  relationships: Relationship[];
  attributes: Attribute[];
  meta: DiagramMeta;
}

export interface GeneratePayload {
  mode: InputMode;
  naturalLanguage?: string;
  sqlSchema?: string;
  sqlDialect?: 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'plain';
  additionalContext?: string;
  domain?: string;
  cardinalityStyle?: 'chen' | 'minmax' | 'both';
  options: {
    showCardinality: boolean;
    showParticipation: boolean;
    showKeyAttributes: boolean;
    includeDerivedAttributes: boolean;
    includeCompositeAttributes: boolean;
    inferWeakEntities: boolean;
    showDataTypes?: boolean;
    skipJunctionTables?: boolean;
  };
}

export interface AppwriteWorkspace {
  $id: string;
  teamId: string;
  name: string;
  slug: string;
  ownerUserId: string;
  plan: 'free' | 'pro' | 'team';
  avatarUrl?: string;
  metadata: string;
}

export interface AppwriteSubscription {
  $id: string;
  workspaceId: string;
  teamId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  paymentProvider: 'stripe' | 'uropay';
  uropayCustomerId?: string;
  uropaySubscriptionId?: string;
  plan: 'free' | 'pro' | 'team';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'paused';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  generationsLimit: number;
  seatLimit: number;
}

export interface AppwriteDiagram {
  $id: string;
  $updatedAt: string;
  workspaceId: string;
  teamId: string;
  projectId?: string;
  title: string;
  schema: string;
  rawInput: string;
  inputMode: InputMode;
  layoutOverrides: string;
  version: number;
  isPublic: boolean;
  shareToken?: string;
}
