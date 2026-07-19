package com.enistere.core.modules.authorization;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/me/authorization")
public class AuthorizationController {

    private final AuthorizationService authorizationService;

    public AuthorizationController(AuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    @GetMapping
    public ResponseEntity<AuthorizationSummaryDto> getAuthorization(Authentication authentication) {
        return ResponseEntity.ok(authorizationService.getAuthorization(
            authorizationService.requireUserId(authentication)
        ));
    }
}
