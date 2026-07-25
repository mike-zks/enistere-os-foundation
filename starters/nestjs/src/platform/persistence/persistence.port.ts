/**
 * Domain-neutral persistence seam.
 *
 * Capabilities specialize this port with their own entity and identifier types.
 * The contract intentionally exposes no Prisma type: Prisma belongs to adapters,
 * never to domain or capability contracts.
 */
export interface PersistencePort<Entity, Identifier> {
  findById(id: Identifier): Promise<Entity | null>;
  save(entity: Entity): Promise<Entity>;
  deleteById(id: Identifier): Promise<void>;
}
