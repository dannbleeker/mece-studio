/**
 * Branded ID types — a string nominally typed per entity kind, so a NodeId
 * can't be passed where a SplitId is expected. Pattern borrowed from TP Studio.
 */
type Brand<T, B extends string> = T & { readonly __brand: B };

export type NodeId = Brand<string, 'NodeId'>;
export type SplitId = Brand<string, 'SplitId'>;
export type DocId = Brand<string, 'DocId'>;
