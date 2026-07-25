package com.enistere.core.platform.observability;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public record TraceContext(String traceId, String traceparent) {
    private static final Pattern W3C =
        Pattern.compile("^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$");
    private static final SecureRandom RANDOM = new SecureRandom();

    public static TraceContext continueOrCreate(String value) {
        Matcher matcher = value == null ? null : W3C.matcher(value.toLowerCase());
        boolean valid = matcher != null && matcher.matches()
            && !matcher.group(1).equals("0".repeat(32))
            && !matcher.group(2).equals("0".repeat(16));
        String traceId = valid ? matcher.group(1) : randomHex(16);
        String flags = valid ? matcher.group(3) : "01";
        return new TraceContext(traceId, "00-" + traceId + "-" + randomHex(8) + "-" + flags);
    }

    private static String randomHex(int bytes) {
        byte[] value = new byte[bytes];
        RANDOM.nextBytes(value);
        return HexFormat.of().formatHex(value);
    }
}
