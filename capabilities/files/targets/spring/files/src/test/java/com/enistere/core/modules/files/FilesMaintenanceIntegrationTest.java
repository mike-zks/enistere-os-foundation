package com.enistere.core.modules.files;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.files.FilesConfig;
import com.enistere.core.modules.files.storage.FakeStorageService;
import com.enistere.core.modules.audit.AuditLog;
import com.enistere.core.modules.audit.AuditLogRepository;
import com.enistere.core.modules.users.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.ByteArrayInputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Reconciliation responsibility: exclusive maintenance and conditional purge.
 */
class FilesMaintenanceIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory factory;
    @Autowired private StoredFileRepository repository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private FakeStorageService storage;
    @Autowired private FilesConfig filesConfig;
    @Autowired private FileMaintenanceService maintenance;
    @Autowired private javax.sql.DataSource dataSource;
    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User owner;

    @BeforeEach
    void setup() {
        owner = factory.createUser(factory.uniqueEmail(), "maintenance-test-pwd");
        filesConfig.setPurgeRetentionSeconds(0L);
    }

    @AfterEach
    void restoreRetention() {
        filesConfig.setPurgeRetentionSeconds(604_800L);
    }

    @Test
    void purgesADeletedRecordOnlyWhenItsObjectIsAbsent() {
        StoredFile gone = storedFile("gone", FileStatus.DELETED);
        StoredFile stillThere = storedFile("still-there", FileStatus.DELETED);
        storage.upload(new ByteArrayInputStream(new byte[] {1}), stillThere.getStorageKey(), "text/plain", 1);

        maintenance.purgeDeletedMetadata();

        // Asserted on these two rows specifically: the suite shares a database,
        // so other tests' deleted rows are legitimately swept by the same pass.
        assertThat(repository.findById(gone.getId())).isEmpty();
        // Dropping this row would orphan its object for good, with nothing left
        // pointing at it — so it is kept and signalled instead.
        assertThat(repository.findById(stillThere.getId())).isPresent();
    }

    @Test
    void keepsRecordsWhoseRetentionHasNotElapsed() {
        filesConfig.setPurgeRetentionSeconds(3_600L);
        StoredFile recent = storedFile("recent", FileStatus.DELETED);

        maintenance.purgeDeletedMetadata();

        assertThat(repository.findById(recent.getId())).isPresent();
    }

    @Test
    void neverPurgesARecordThatIsNotDeleted() {
        StoredFile active = storedFile("active", FileStatus.VALIDATED);

        maintenance.purgeDeletedMetadata();

        assertThat(repository.findById(active.getId())).isPresent();
    }

    @Test
    void refusesAConcurrentRunInsteadOfQueueingIt() throws Exception {
        // Hold the same advisory lock from an independent connection, which is
        // what a maintenance pass running elsewhere looks like to this instance.
        try (Connection held = dataSource.getConnection()) {
            held.setAutoCommit(false);
            try (PreparedStatement lock = held.prepareStatement(
                    "SELECT pg_advisory_xact_lock(hashtext(?)::bigint)")) {
                lock.setString(1, "files-maintenance");
                lock.execute();
            }

            assertThatThrownBy(() -> maintenance.purgeDeletedMetadata())
                .isInstanceOf(FileMaintenanceService.MaintenanceBusyException.class);

            held.rollback();
        }
    }

    @Test
    void lockIsReleasedSoALaterRunSucceeds() {
        // Transaction-scoped: two sequential passes must both go through.
        assertThat(maintenance.purgeDeletedMetadata()).isNotNull();
        assertThat(maintenance.purgeDeletedMetadata()).isNotNull();
    }

    @Test
    void purgeIsAudited() {
        auditLogRepository.deleteAll();
        storedFile("audited", FileStatus.DELETED);

        maintenance.purgeDeletedMetadata();

        assertThat(auditLogRepository.findAll()).extracting(AuditLog::getEventType)
            .contains("FILE_ORPHAN_DELETED");
    }

    // helpers

    private StoredFile storedFile(String name, FileStatus status) {
        StoredFile file = new StoredFile();
        file.setOriginalName(name + ".txt");
        file.setStorageKey("document/" + UUID.randomUUID().toString().replace("-", "") + ".txt");
        file.setBucket(filesConfig.getBucket());
        file.setMimeType("text/plain");
        file.setExtension("txt");
        file.setSize(10L);
        file.setCategory(FileCategory.DOCUMENT);
        file.setStatus(status);
        file.setOwnerId(owner.getId());
        StoredFile saved = repository.save(file);
        // Backdate updatedAt so retention is measurable without waiting. Done in
        // SQL: the JPA update is @Modifying and would need an outer transaction.
        jdbcTemplate.update("UPDATE stored_files SET updated_at = ? WHERE id = ?",
            java.sql.Timestamp.from(Instant.now().minusSeconds(60)), saved.getId());
        return saved;
    }
}
