package com.giulia.dndacademy.config;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

public final class FrontendOrigin {
    private final String baseUrl;
    private final List<String> allowedOrigins;

    public FrontendOrigin(String configuredUrl, boolean allowLocalOrigins, boolean production) {
        URI uri = parse(configuredUrl);
        String scheme = uri.getScheme().toLowerCase(Locale.ROOT);
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (production && (!scheme.equals("https") || isLoopback(host) || allowLocalOrigins)) {
            throw new IllegalArgumentException("Il profilo prod richiede APP_FRONTEND_BASE_URL HTTPS non locale e app.cors.allow-local-origins=false");
        }
        int port = uri.getPort();
        if ((scheme.equals("https") && port == 443) || (scheme.equals("http") && port == 80)) port = -1;
        try {
            baseUrl = new URI(scheme, null, host, port, null, null, null).toASCIIString();
        } catch (URISyntaxException ex) {
            throw invalidOrigin();
        }
        var origins = new LinkedHashSet<String>();
        origins.add(baseUrl);
        if (allowLocalOrigins) {
            origins.add("http://localhost:3000");
            origins.add("http://127.0.0.1:3000");
        }
        allowedOrigins = List.copyOf(origins);
    }

    public String baseUrl() { return baseUrl; }
    public List<String> allowedOrigins() { return allowedOrigins; }

    private static URI parse(String value) {
        if (value == null || value.isBlank() || value.contains("*")) throw invalidOrigin();
        try {
            URI uri = new URI(value.trim());
            if (uri.getScheme() == null || (!uri.getScheme().equalsIgnoreCase("https") && !uri.getScheme().equalsIgnoreCase("http"))
                    || uri.getHost() == null || uri.getRawUserInfo() != null
                    || uri.getRawQuery() != null || uri.getRawFragment() != null
                    || (uri.getRawPath() != null && !uri.getRawPath().isEmpty() && !uri.getRawPath().equals("/"))
                    || uri.getPort() == 0 || uri.getPort() > 65535) {
                throw invalidOrigin();
            }
            return uri;
        } catch (URISyntaxException ex) {
            throw invalidOrigin();
        }
    }

    private static boolean isLoopback(String host) {
        if (host.startsWith("[") && host.endsWith("]")) {
            try {
                InetAddress address = InetAddress.getByName(host.substring(1, host.length() - 1));
                return address.isLoopbackAddress() || address.isAnyLocalAddress();
            } catch (UnknownHostException ex) {
                throw invalidOrigin();
            }
        }
        String normalized = host.replaceAll("\\.+$", "");
        return normalized.equals("localhost") || normalized.endsWith(".localhost")
                || normalized.equals("0.0.0.0") || normalized.matches("127\\.\\d+\\.\\d+\\.\\d+");
    }

    private static IllegalArgumentException invalidOrigin() {
        return new IllegalArgumentException("APP_FRONTEND_BASE_URL deve essere una singola origine HTTP/HTTPS, senza credenziali, percorsi, query, frammenti o wildcard");
    }
}
