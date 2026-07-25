package com.enistere.core.platform.persistence;

import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.function.Supplier;

/** Spring transaction implementation hidden behind the neutral port. */
@Component
public class SpringTransactionAdapter implements TransactionPort {

    private final TransactionTemplate transactions;

    public SpringTransactionAdapter(PlatformTransactionManager transactionManager) {
        this.transactions = new TransactionTemplate(transactionManager);
    }

    @Override
    public <Result> Result execute(Supplier<Result> work) {
        return transactions.execute(status -> work.get());
    }
}
