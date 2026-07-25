package com.enistere.core.platform.persistence;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SpringTransactionAdapterTest {

    @Test
    void commitsSuccessfulWorkAndReturnsItsValue() {
        var manager = new RecordingTransactionManager();
        var adapter = new SpringTransactionAdapter(manager);

        assertThat(adapter.execute(() -> "committed")).isEqualTo("committed");
        assertThat(manager.commits).isEqualTo(1);
        assertThat(manager.rollbacks).isZero();
    }

    @Test
    void rollsBackFailedWork() {
        var manager = new RecordingTransactionManager();
        var adapter = new SpringTransactionAdapter(manager);

        assertThatThrownBy(() -> adapter.execute(() -> {
            throw new IllegalStateException("failed");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(manager.commits).isZero();
        assertThat(manager.rollbacks).isEqualTo(1);
    }

    private static final class RecordingTransactionManager implements PlatformTransactionManager {
        int commits;
        int rollbacks;

        @Override
        public TransactionStatus getTransaction(TransactionDefinition definition) {
            return new SimpleTransactionStatus();
        }

        @Override
        public void commit(TransactionStatus status) {
            commits++;
        }

        @Override
        public void rollback(TransactionStatus status) {
            rollbacks++;
        }
    }
}
