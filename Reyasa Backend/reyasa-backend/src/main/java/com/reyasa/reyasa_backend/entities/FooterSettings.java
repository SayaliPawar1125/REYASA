
package com.reyasa.reyasa_backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "footer_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FooterSettings {

    @Id
    private Long id;

    @Column(length = 100, nullable = false)
    private String brandName;

    @Column(length = 255)
    private String tagline;

    @Lob
    private String description;

    @Column(length = 50)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String address;

    @Lob
    private String quickLinksJson;

    @Lob
    private String socialLinksJson;

    @Lob
    private String policyLinksJson;

    @Column(length = 255)
    private String copyright;
}
