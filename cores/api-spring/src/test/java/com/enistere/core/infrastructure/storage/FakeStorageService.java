package com.enistere.core.infrastructure.storage;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Profile("test")
public class FakeStorageService implements StorageService {

    private final Map<String, Boolean> uploaded = new ConcurrentHashMap<>();

    @Override
    public void upload(InputStream content, String storageKey, String contentType, long size) {
        uploaded.put(storageKey, true);
    }

    @Override
    public void delete(String storageKey) {
        uploaded.remove(storageKey);
    }

    public boolean wasUploaded(String storageKey) {
        return uploaded.containsKey(storageKey);
    }

    public void reset() {
        uploaded.clear();
    }
}
