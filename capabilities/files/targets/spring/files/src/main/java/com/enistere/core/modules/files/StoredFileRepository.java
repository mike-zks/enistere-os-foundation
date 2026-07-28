package com.enistere.core.modules.files;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByIdAndOwnerId(UUID id, UUID ownerId);

    /**
     * One page of the caller's own files, newest first, excluding deleted rows.
     *
     * <p>Ordering is {@code createdAt DESC, id DESC}: {@code createdAt} alone is
     * not a total order — two files created in the same instant would page
     * non-deterministically and could be skipped or repeated across pages.
     */
    List<StoredFile> findByOwnerIdAndStatusNotOrderByCreatedAtDescIdDesc(
        UUID ownerId, FileStatus status, Pageable pageable);

    long countByOwnerIdAndStatusNot(UUID ownerId, FileStatus status);

    /**
     * Status transition applied conditionally, in a single statement.
     *
     * <p>Reading the row then writing it back would let a concurrent deletion be
     * silently undone: a file deleted between the read and the write would come
     * back as quarantined or validated. Requiring the expected status in the
     * WHERE clause makes the loser of the race observable — zero rows updated.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update StoredFile f set f.status = :next, f.updatedAt = :now "
        + "where f.id = :id and f.status = :expected")
    int transitionStatus(@Param("id") UUID id,
                         @Param("expected") FileStatus expected,
                         @Param("next") FileStatus next,
                         @Param("now") Instant now);
}
