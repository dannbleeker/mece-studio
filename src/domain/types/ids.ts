/**
 * Branded ID types — a string nominally typed per entity kind, so a NodeId
 * can't be passed where a SplitId is expected. Pattern borrowed from TP Studio.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type NodeId = Brand<string, 'NodeId'>;
export type SplitId = Brand<string, 'SplitId'>;
export type DocId = Brand<string, 'DocId'>;

/** A partial update to an entity that always carries its id. */
export type Patch<T extends { id: unknown }> = Partial<T> & Pick<T, 'id'>;
