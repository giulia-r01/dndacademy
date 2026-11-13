package com.giulia.dndacademy.security.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.net.InetAddress;
import java.util.Collections;

@Component
public class ClientAddressResolver {
    private final String source;

    public ClientAddressResolver(@Value("${app.client-ip-source:remote}") String source) {
        if (!java.util.Set.of("remote", "railway", "render").contains(source)) {
            throw new IllegalArgumentException("app.client-ip-source deve essere remote, railway o render");
        }
        this.source = source;
    }

    public String resolve(HttpServletRequest request) {
        String value = request.getRemoteAddr();
        if (!source.equals("remote")) {
            var headers = Collections.list(request.getHeaders(source.equals("render") ? "CF-Connecting-IP" : "X-Real-IP"));
            if (headers.size() != 1) throw invalidAddress();
            value = headers.get(0);
        }
        if (value == null || value.length() > 45) throw invalidAddress();
        try {
            byte[] bytes;
            if (value.contains(":")) {
                if (!value.matches("[0-9a-fA-F:.]+")) throw invalidAddress();
                bytes = InetAddress.getByName(value).getAddress();
            } else {
                String[] octets = value.split("\\.", -1);
                if (octets.length != 4) throw invalidAddress();
                bytes = new byte[4];
                for (int i = 0; i < 4; i++) {
                    if (!octets[i].matches("0|[1-9][0-9]{0,2}")) throw invalidAddress();
                    int number = Integer.parseInt(octets[i]);
                    if (number > 255) throw invalidAddress();
                    bytes[i] = (byte) number;
                }
            }
            if (bytes.length == 16) java.util.Arrays.fill(bytes, 8, 16, (byte) 0);
            return InetAddress.getByAddress(bytes).getHostAddress();
        } catch (java.net.UnknownHostException ex) {
            throw invalidAddress();
        }
    }

    private ResponseStatusException invalidAddress() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indirizzo della richiesta non valido.");
    }
}
