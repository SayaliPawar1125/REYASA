
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.FooterSettingsDto;
import com.reyasa.reyasa_backend.services.FooterSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class FooterSettingsController {

    private final FooterSettingsService footerService;

    public FooterSettingsController(
            FooterSettingsService footerService) {
        this.footerService = footerService;
    }

    // Public storefront footer
    @GetMapping("/footer")
    public ResponseEntity<FooterSettingsDto> getFooter() {
        return ResponseEntity.ok(footerService.getFooter());
    }

    // Admin: save footer settings
    @PutMapping("/admin/footer")
    public ResponseEntity<FooterSettingsDto> saveFooter(
            @RequestBody FooterSettingsDto dto) {
        return ResponseEntity.ok(footerService.saveFooter(dto));
    }

    // Admin: restore default footer settings
    @PutMapping("/admin/footer/reset")
    public ResponseEntity<FooterSettingsDto> resetFooter() {
        return ResponseEntity.ok(footerService.resetFooter());
    }
}
