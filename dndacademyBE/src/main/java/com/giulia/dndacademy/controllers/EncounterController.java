package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.EncounterDTO;
import com.giulia.dndacademy.dto.EncounterRequest;
import com.giulia.dndacademy.service.EncounterService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/encounters")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MASTER')")
public class EncounterController {

    private final EncounterService encounterService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EncounterDTO createEncounter(
            @RequestBody @Valid EncounterRequest request,
            Authentication authentication
    ) {
        return encounterService.createEncounter(
                request,
                authentication.getName()
        );
    }

    @GetMapping("/chapter/{chapterId}")
    public List<EncounterDTO> getEncountersByChapter(
            @PathVariable Long chapterId,
            Authentication authentication
    ) {
        return encounterService.getEncountersByChapter(
                chapterId,
                authentication.getName()
        );
    }

    @GetMapping("/{encounterId}")
    public EncounterDTO getEncounterById(
            @PathVariable Long encounterId,
            Authentication authentication
    ) {
        return encounterService.getEncounterById(
                encounterId,
                authentication.getName()
        );
    }

    @PutMapping("/{encounterId}")
    public EncounterDTO updateEncounter(
            @PathVariable Long encounterId,
            @RequestBody @Valid EncounterRequest request,
            Authentication authentication
    ) {
        return encounterService.updateEncounter(
                encounterId,
                request,
                authentication.getName()
        );
    }

    @DeleteMapping("/{encounterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEncounter(
            @PathVariable Long encounterId,
            Authentication authentication
    ) {
        encounterService.deleteEncounter(
                encounterId,
                authentication.getName()
        );
    }
}