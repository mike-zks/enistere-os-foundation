package com.enistere.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "enistere.security.argon2")
@Validated
public class Argon2Config {

    private int saltLength = 16;
    private int hashLength = 32;
    private int parallelism = 1;
    private int memory = 65536;   // 64 MB
    private int iterations = 3;

    public int getSaltLength() { return saltLength; }
    public void setSaltLength(int saltLength) { this.saltLength = saltLength; }

    public int getHashLength() { return hashLength; }
    public void setHashLength(int hashLength) { this.hashLength = hashLength; }

    public int getParallelism() { return parallelism; }
    public void setParallelism(int parallelism) { this.parallelism = parallelism; }

    public int getMemory() { return memory; }
    public void setMemory(int memory) { this.memory = memory; }

    public int getIterations() { return iterations; }
    public void setIterations(int iterations) { this.iterations = iterations; }
}
