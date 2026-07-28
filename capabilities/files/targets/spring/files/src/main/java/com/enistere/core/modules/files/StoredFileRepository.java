package com.enistere.core.modules.files;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
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
    /**
     * Serializes one owner's concurrent uploads.
     *
     * <p>Counting then inserting is not atomic on its own: two uploads racing for
     * the last slot both read the same count and both insert. The transaction-scoped
     * advisory lock makes the check and the insert inseparable for a given owner,
     * without locking the table or blocking other owners. It is released with the
     * transaction, including on rollback.
     */
    @Query(value = "SELECT pg_advisory_xact_lock(hashtext(:key)::bigint)", nativeQuery = true)
    void lockOwnerForQuota(@Param("key") String key);

    /**
     * Non-blocking exclusive lock for maintenance. Returns false immediately when
     * another pass holds it, so a concurrent caller is refused rather than queued
     * behind a long-running job.
     */
    @Query(value = "SELECT pg_try_advisory_xact_lock(hashtext(:key)::bigint)", nativeQuery = true)
    boolean tryLockMaintenance(@Param("key") String key);

    /** Active files consume quota; rejected and deleted ones no longer do. */
    @Query("select count(f) from StoredFile f where f.ownerId = :ownerId and f.status in :statuses")
    long countActiveByOwner(@Param("ownerId") UUID ownerId,
                            @Param("statuses") Collection<FileStatus> statuses);

    @Query("select coalesce(sum(f.size), 0) from StoredFile f "
        + "where f.ownerId = :ownerId and f.status in :statuses")
    long sumActiveSizeByOwner(@Param("ownerId") UUID ownerId,
                              @Param("statuses") Collection<FileStatus> statuses);

    /** Deleted records eligible for physical purge once their retention has elapsed. */
    @Query("select f from StoredFile f where f.status = :status and f.updatedAt < :before")
    List<StoredFile> findPurgeCandidates(@Param("status") FileStatus status,
                                         @Param("before") Instant before);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update StoredFile f set f.status = :next, f.updatedAt = :now "
        + "where f.id = :id and f.status = :expected")
    int transitionStatus(@Param("id") UUID id,
                         @Param("expected") FileStatus expected,
                         @Param("next") FileStatus next,
                         @Param("now") Instant now);
}
