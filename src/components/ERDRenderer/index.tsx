import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { layoutERD } from './layout';
import {
  StrongEntity, WeakEntity, Relationship, IdentifyingRelationship,
  SimpleAttribute, KeyAttribute, PartialKeyAttribute, DerivedAttribute,
  MultivaluedAttribute, CompositeAttribute, ConnectionLine, CardinalityLabel
} from './shapes';
import type { ERDSchema } from '../../lib/types';

export interface ERDRendererProps {
  schema: ERDSchema;
  options: {
    showCardinality: boolean;
    showParticipation: boolean;
  };
}

export interface ERDRendererHandle {
  downloadSVG: () => void;
  getSVGElement: () => SVGSVGElement | null;
}

export const ERDRenderer = forwardRef<ERDRendererHandle, ERDRendererProps>(({ schema, options }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useImperativeHandle(ref, () => ({
    downloadSVG: () => {
      if (!svgRef.current) return;
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      // inject proper xmlns if missing
      const svgStr = svgData.replace(/<svg\s+/, '<svg xmlns="http://www.w3.org/2000/svg" ');
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${schema.meta.title || 'erd'}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }));

  const layout = layoutERD(schema);
  // Add 60px padding all around
  const padding = 60;
  const viewBox = `0 0 ${layout.graphWidth + padding * 2} ${layout.graphHeight + padding * 2}`;

  const getNodePos = (id: string) => {
    const n = layout.nodes[id];
    return n ? { x: n.x + padding, y: n.y + padding, w: n.width, h: n.height } : { x: 0, y: 0, w: 0, h: 0 };
  };

  return (
    <div className="w-full h-full overflow-auto bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 p-4">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBox}
        className="w-full h-auto drop-shadow-sm min-h-[500px]"
        style={{ '--color-text-primary': 'var(--color-primary-foreground, currentColor)', '--color-background-primary': 'var(--color-background, transparent)' } as React.CSSProperties}
      >
        <g id="lines">
          {schema.relationships.map(rel => {
            const rPos = getNodePos(rel.id);
            return rel.participants.map(p => {
              const ePos = getNodePos(p.entityId);
              return (
                <React.Fragment key={`${rel.id}-${p.entityId}`}>
                  <ConnectionLine x1={ePos.x} y1={ePos.y} x2={rPos.x} y2={rPos.y} isDouble={options.showParticipation && p.participation === 'total'} />
                  {options.showCardinality && (
                    <CardinalityLabel x1={ePos.x} y1={ePos.y} x2={rPos.x} y2={rPos.y} label={p.cardinality} />
                  )}
                </React.Fragment>
              );
            });
          })}
          {schema.attributes.map(attr => {
            const aPos = getNodePos(attr.id);
            const pPos = getNodePos(attr.parentId);
            return (
              <React.Fragment key={`${attr.id}-${attr.parentId}`}>
                <ConnectionLine x1={pPos.x} y1={pPos.y} x2={aPos.x} y2={aPos.y} isDouble={false} />
                {attr.type === 'composite' && attr.childAttributes?.map(child => {
                  const cPos = getNodePos(child.id);
                  return <ConnectionLine key={`${attr.id}-${child.id}`} x1={aPos.x} y1={aPos.y} x2={cPos.x} y2={cPos.y} isDouble={false} />;
                })}
              </React.Fragment>
            );
          })}
          {schema.relationships.map(rel => {
            const rPos = getNodePos(rel.id);
            return rel.attributes.map(attr => {
              const edgeAttrId = `${rel.id}_attr_${attr.id}`;
              const aPos = getNodePos(edgeAttrId);
              return <ConnectionLine key={`${rel.id}-${attr.id}`} x1={rPos.x} y1={rPos.y} x2={aPos.x} y2={aPos.y} isDouble={false} />;
            });
          })}
        </g>

        <g id="nodes">
          {schema.entities.map(e => {
            const pos = getNodePos(e.id);
            return e.isWeak ? 
              <WeakEntity key={e.id} x={pos.x} y={pos.y} width={pos.w} height={pos.h} name={e.name} /> : 
              <StrongEntity key={e.id} x={pos.x} y={pos.y} width={pos.w} height={pos.h} name={e.name} />;
          })}
          
          {schema.relationships.map(r => {
            const pos = getNodePos(r.id);
            return r.isIdentifying ?
              <IdentifyingRelationship key={r.id} x={pos.x} y={pos.y} width={pos.w} height={pos.h} name={r.name} /> :
              <Relationship key={r.id} x={pos.x} y={pos.y} width={pos.w} height={pos.h} name={r.name} />;
          })}

          {schema.relationships.map(r => r.attributes.map(a => {
            const id = `${r.id}_attr_${a.id}`;
            const pos = getNodePos(id);
            if (a.type === 'derived') return <DerivedAttribute key={id} cx={pos.x} cy={pos.y} rx={pos.w / 2} ry={pos.h / 2} name={a.name} />;
            if (a.type === 'multivalued') return <MultivaluedAttribute key={id} cx={pos.x} cy={pos.y} rx={pos.w / 2} ry={pos.h / 2} name={a.name} />;
            return <SimpleAttribute key={id} cx={pos.x} cy={pos.y} rx={pos.w / 2} ry={pos.h / 2} name={a.name} />;
          }))}

          {schema.attributes.map(a => {
            const pos = getNodePos(a.id);
            const rx = pos.w / 2;
            const ry = pos.h / 2;
            
            let ShapeElement = SimpleAttribute;
            if (a.type === 'key') ShapeElement = KeyAttribute;
            else if (a.type === 'partialKey') ShapeElement = PartialKeyAttribute;
            else if (a.type === 'derived') ShapeElement = DerivedAttribute;
            else if (a.type === 'multivalued') ShapeElement = MultivaluedAttribute;
            else if (a.type === 'composite') ShapeElement = CompositeAttribute;

            return (
              <React.Fragment key={a.id}>
                <ShapeElement cx={pos.x} cy={pos.y} rx={rx} ry={ry} name={a.name} />
                {a.type === 'composite' && a.childAttributes?.map(child => {
                  const cPos = getNodePos(child.id);
                  return <SimpleAttribute key={child.id} cx={cPos.x} cy={cPos.y} rx={cPos.w / 2} ry={cPos.h / 2} name={child.name} />;
                })}
              </React.Fragment>
            );
          })}
        </g>
      </svg>
    </div>
  );
});
