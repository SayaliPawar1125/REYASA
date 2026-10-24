package com.reyasa.reyasa_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAdminProfileRequest {

    private String firstName;
    private String lastName;
    private String email;
}