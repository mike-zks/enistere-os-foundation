package com.enistere.core.platform.persistence;

import java.util.Optional;

/**
 * Domain-neutral persistence seam. Capabilities specialize it with their own
 * domain types; Spring Data and JPA remain adapter details.
 */
public interface PersistencePort<Entity, Identifier> {
    Optional<Entity> findById(Identifier id);
    Entity save(Entity entity);
    void deleteById(Identifier id);
}
