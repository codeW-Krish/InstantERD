import dagre from 'dagre';
import type { ERDSchema } from '../../lib/types';

export interface LayoutResult {
  nodes: Record<string, { x: number; y: number; width: number; height: number }>;
  graphWidth: number;
  graphHeight: number;
}

export function layoutERD(schema: ERDSchema): LayoutResult {
  const graph = new dagre.graphlib.Graph();
  
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 120,
    marginx: 40,
    marginy: 40
  });

  graph.setDefaultEdgeLabel(() => ({}));

  // Add Entities
  schema.entities.forEach(entity => {
    graph.setNode(entity.id, { width: 160, height: 50 });
  });

  // Add Relationships
  schema.relationships.forEach(rel => {
    graph.setNode(rel.id, { width: 120, height: 60 });
    
    // Connect relationship to its participant entities
    rel.participants.forEach(p => {
      // Direction doesn't matter much for layout but keeping consistency
      graph.setEdge(p.entityId, rel.id);
    });

    // Add Relationship Attributes
    rel.attributes.forEach(attr => {
      const edgeAttrId = `${rel.id}_attr_${attr.id}`;
      graph.setNode(edgeAttrId, { width: 120, height: 40 });
      graph.setEdge(rel.id, edgeAttrId);
    });
  });

  // Add Entity Attributes
  schema.attributes.forEach(attr => {
    graph.setNode(attr.id, { width: 120, height: 40 });
    graph.setEdge(attr.parentId, attr.id);

    // If composite, add child attributes
    if (attr.type === 'composite' && attr.childAttributes) {
      attr.childAttributes.forEach(child => {
        graph.setNode(child.id, { width: 120, height: 40 });
        graph.setEdge(attr.id, child.id);
      });
    }
  });

  // Execute Layout Compute
  dagre.layout(graph);

  const nodes: LayoutResult['nodes'] = {};
  graph.nodes().forEach(v => {
    const node = graph.node(v);
    if (node) {
      nodes[v] = {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
      };
    }
  });

  const graphSettings = graph.graph();

  return {
    nodes,
    graphWidth: graphSettings.width || 800,
    graphHeight: graphSettings.height || 600
  };
}
