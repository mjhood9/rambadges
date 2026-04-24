package com.backend.laissezpasserservice.clients;

import com.backend.laissezpasserservice.dao.dtos.DemandeDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DemandeClientFallback implements DemandeClient {

    private static final Logger log = LoggerFactory.getLogger(DemandeClientFallback.class);

    @Override
    public DemandeDTO getDemandeById(Long id) {
        log.error("User-service unavailable for id: {}", id);
        throw new RuntimeException("User service unavailable");
    }
}
