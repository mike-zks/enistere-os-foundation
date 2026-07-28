package com.enistere.core.modules.files;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
