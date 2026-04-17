package com.backend.demandeservice.clients;

import com.backend.demandeservice.dao.dtos.UserResponse;
import org.slf4j.*;
import org.springframework.stereotype.Component;

@Component
public class UserClientFallback implements UserClient {

    private static final Logger log = LoggerFactory.getLogger(UserClientFallback.class);

    @Override
    public UserResponse getUserById(Long id) {
        log.error("User-service unavailable for id: {}", id);
        throw new RuntimeException("User service unavailable");
    }
}
