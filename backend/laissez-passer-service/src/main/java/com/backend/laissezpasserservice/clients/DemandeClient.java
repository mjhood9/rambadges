package com.backend.laissezpasserservice.clients;

import com.backend.laissezpasserservice.web.config.FeignConfig;
import com.backend.laissezpasserservice.dao.dtos.DemandeDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "demande-service", fallback = DemandeClientFallback.class, configuration = FeignConfig.class)
public interface DemandeClient {

    @GetMapping("/api/demandes/{id}")
    DemandeDTO getDemandeById(@PathVariable("id") Long id);
}
