package com.roadrescue.backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HelpRequest {
    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotBlank
    private String issueDescription;
}
