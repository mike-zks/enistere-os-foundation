package com.enistere.core.platform.persistence;

import java.util.function.Supplier;

/** Framework-neutral transaction boundary. */
public interface TransactionPort {
    <Result> Result execute(Supplier<Result> work);
}
